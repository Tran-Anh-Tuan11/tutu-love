import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSpecialDays } from "@/lib/specialDays";
import { todayKey } from "@/lib/date";

export async function GET() {
  const today = todayKey();
  const days = await getSpecialDays();
  const dismissedToday = await prisma.dismissedReminder.findMany({ where: { date: today } });
  const dismissedKeys = new Set(dismissedToday.map((d) => d.occasionKey));

  const reminders = days
    .filter((d) => d.daysLeft >= 0 && d.daysLeft <= 3 && !dismissedKeys.has(d.occasionKey))
    .map((d) => ({ occasionKey: d.occasionKey, name: d.name, daysLeft: d.daysLeft }));

  return NextResponse.json({ reminders });
}
