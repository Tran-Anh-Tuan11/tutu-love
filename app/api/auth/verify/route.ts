import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

// Ngưỡng khoảng cách Euclidean chuẩn của face-api.js (128-d descriptor).
const MATCH_THRESHOLD = 0.5;

function distance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descriptor } = body as { descriptor?: number[] };
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    return jsonError("Thiếu dữ liệu khuôn mặt");
  }

  const users = await prisma.user.findMany({ where: { faceDescriptor: { not: null } } });

  let best: { userId: string; dist: number } | null = null;
  for (const u of users) {
    if (!u.faceDescriptor) continue;
    const stored = JSON.parse(u.faceDescriptor) as number[];
    if (stored.length !== descriptor.length) continue;
    const d = distance(stored, descriptor);
    if (!best || d < best.dist) best = { userId: u.id, dist: d };
  }

  if (!best || best.dist > MATCH_THRESHOLD) {
    return NextResponse.json({ matched: false, userId: null });
  }

  await createSession(best.userId);
  return NextResponse.json({ matched: true, userId: best.userId });
}
