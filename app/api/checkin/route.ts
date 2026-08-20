import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isAfter18h, todayKey } from "@/lib/date";
import { LOVE_PHRASE, normalizePhrase, applyDailyCompletion } from "@/lib/streak";
import { jsonError } from "@/lib/api";

export async function GET() {
  const today = todayKey();
  const rows = await prisma.checkIn.findMany({ where: { date: today } });
  const byUser = (id: string) => {
    const r = rows.find((x) => x.userId === id);
    return {
      morningDone: r?.morningDone ?? false,
      eveningDone: r?.eveningDone ?? false,
      morningAt: r?.morningAt ?? null,
      eveningAt: r?.eveningAt ?? null,
    };
  };

  const session = await getSession();
  const myUnlockedToday = session ? byUser(session.userId).morningDone : false;

  return NextResponse.json({
    nam: byUser("nam"),
    nu: byUser("nu"),
    myUnlockedToday,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { phrase } = body as { phrase?: string };
  if (!phrase) return jsonError("Thiếu lời yêu thương");

  const today = todayKey();
  const userId = session.userId;
  const existing = await prisma.checkIn.findUnique({
    where: { date_userId: { date: today, userId } },
  });

  const morningDone = existing?.morningDone ?? false;
  const eveningDone = existing?.eveningDone ?? false;

  // Qua 18h mà chưa làm lượt mở đầu ngày → vẫn ưu tiên lượt mở đầu trước.
  let phase: "morning" | "evening";
  if (!morningDone) phase = "morning";
  else if (!eveningDone && isAfter18h()) phase = "evening";
  else if (!eveningDone) return jsonError("Lượt cuối ngày chỉ mở sau 18h", 409);
  else return jsonError("Đã hoàn thành đủ 2 lượt hôm nay", 409);

  const expected = LOVE_PHRASE[userId];
  if (normalizePhrase(phrase) !== normalizePhrase(expected)) {
    return jsonError(`Câu chưa đúng — hãy nói/gõ "${expected}"`, 422);
  }

  const now = new Date();
  const data =
    phase === "morning"
      ? { morningDone: true, morningAt: now }
      : { eveningDone: true, eveningAt: now };

  const row = await prisma.checkIn.upsert({
    where: { date_userId: { date: today, userId } },
    create: { date: today, userId, ...data },
    update: data,
  });

  if (row.morningDone && row.eveningDone) {
    await applyDailyCompletion(userId, today);
  }

  return NextResponse.json({ ok: true, phase });
}
