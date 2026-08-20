import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function isUnlockedToday(userId: string): Promise<boolean> {
  const row = await prisma.checkIn.findUnique({
    where: { date_userId: { date: todayKey(), userId } },
  });
  return !!row?.morningDone;
}
