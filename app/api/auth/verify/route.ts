import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { jsonError } from "@/lib/api";
import { LOVE_PHRASE, normalizePhrase } from "@/lib/streak";
import { recordCheckIn } from "@/lib/checkin";
import { FACE_MATCH_THRESHOLD, faceDistance } from "@/lib/faceMatch";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descriptor, phrase } = body as { descriptor?: number[]; phrase?: string };
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    return jsonError("Thiếu dữ liệu khuôn mặt");
  }

  const users = await prisma.user.findMany({ where: { faceDescriptor: { not: null } } });

  let best: { userId: string; dist: number } | null = null;
  for (const u of users) {
    if (!u.faceDescriptor) continue;
    const stored = JSON.parse(u.faceDescriptor) as number[];
    if (stored.length !== descriptor.length) continue;
    const d = faceDistance(stored, descriptor);
    if (!best || d < best.dist) best = { userId: u.id, dist: d };
  }

  if (!best || best.dist > FACE_MATCH_THRESHOLD) {
    return NextResponse.json({ matched: false, userId: null });
  }

  // Khi có `phrase` (đăng nhập từ /login): phải nói/gõ đúng lời yêu thương của mình mới
  // được cấp session — và lượt đăng nhập này tính luôn thành 1 lượt check-in cho streak.
  // Khi không có `phrase` (VD: xác thực lại trước khi khôi phục streak) thì giữ hành vi cũ.
  if (phrase !== undefined) {
    const expected = LOVE_PHRASE[best.userId];
    if (normalizePhrase(phrase) !== normalizePhrase(expected)) {
      return NextResponse.json({
        matched: true,
        userId: best.userId,
        phraseOk: false,
        error: `Câu chưa đúng — hãy nói/gõ "${expected}"`,
      });
    }

    await createSession(best.userId);
    const { phase } = await recordCheckIn(best.userId);
    return NextResponse.json({ matched: true, userId: best.userId, phraseOk: true, checkinPhase: phase });
  }

  await createSession(best.userId);
  return NextResponse.json({ matched: true, userId: best.userId });
}
