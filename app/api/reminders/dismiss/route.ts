import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { todayKey } from "@/lib/date";
import { jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { occasionKey } = body as { occasionKey?: string };
  if (!occasionKey) return jsonError("Thiếu occasionKey");

  const today = todayKey();
  await prisma.dismissedReminder.upsert({
    where: { occasionKey_date: { occasionKey, date: today } },
    create: { occasionKey, date: today },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
