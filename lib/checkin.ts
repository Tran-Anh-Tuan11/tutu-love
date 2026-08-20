import { prisma } from "@/lib/prisma";
import { isAfter18h, todayKey } from "@/lib/date";
import { applyDailyCompletion } from "@/lib/streak";

export type CheckInPhase = "morning" | "evening";

export function nextAvailablePhase(morningDone: boolean, eveningDone: boolean): CheckInPhase | null {
  if (!morningDone) return "morning";
  if (!eveningDone && isAfter18h()) return "evening";
  return null;
}

// Ghi nhận check-in "tùy khả năng" — dùng cho lượt đăng nhập bằng giọng nói:
// nếu không còn lượt nào mở (đã xong cả 2, hoặc lượt cuối ngày chưa tới giờ) thì
// bỏ qua thay vì báo lỗi, vì đăng nhập vẫn phải thành công bình thường.
export async function recordCheckIn(userId: string): Promise<{ phase: CheckInPhase | null }> {
  const today = todayKey();
  const existing = await prisma.checkIn.findUnique({
    where: { date_userId: { date: today, userId } },
  });
  const morningDone = existing?.morningDone ?? false;
  const eveningDone = existing?.eveningDone ?? false;

  const phase = nextAvailablePhase(morningDone, eveningDone);
  if (!phase) return { phase: null };

  const now = new Date();
  const data = phase === "morning" ? { morningDone: true, morningAt: now } : { eveningDone: true, eveningAt: now };

  const row = await prisma.checkIn.upsert({
    where: { date_userId: { date: today, userId } },
    create: { date: today, userId, ...data },
    update: data,
  });

  if (row.morningDone && row.eveningDone) {
    await applyDailyCompletion(userId, today);
  }

  return { phase };
}
