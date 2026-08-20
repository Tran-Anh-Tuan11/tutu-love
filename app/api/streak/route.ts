import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStreak } from "@/lib/streak";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ current: 0, longest: 0, broken: false, streakBeforeBreak: 0 });
  }
  const streak = await getStreak(session.userId);
  return NextResponse.json({
    current: streak.currentStreak,
    longest: streak.longestStreak,
    broken: !!streak.brokenAt,
    streakBeforeBreak: streak.streakBeforeBreak,
  });
}
