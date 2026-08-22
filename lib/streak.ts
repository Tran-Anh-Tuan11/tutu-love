import { prisma } from "@/lib/prisma";
import { addDays, todayKey } from "@/lib/date";

export const LOVE_PHRASE: Record<string, string> = {
  nam: "anh yêu em",
  nu: "em yêu anh",
};

// Giọng nói trên di động (đặc biệt Android) thường trả về câu viết hoa chữ đầu và có dấu
// câu ở cuối (VD "Anh yêu em."), và đôi khi ở dạng Unicode tổ hợp khác (NFD) khiến so sánh
// chuỗi trực tiếp sai dù nhìn giống hệt — chuẩn hóa hết các trường hợp này trước khi so khớp.
export function normalizePhrase(s: string): string {
  return s
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:…]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureStreak(userId: string) {
  return prisma.streak.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// Phát hiện "đứt streak" một cách lazy: nếu lần hoàn thành gần nhất không phải hôm qua
// (và cũng không phải hôm nay), nghĩa là đã có ít nhất 1 ngày bị bỏ lỡ ở giữa.
async function applyLazyBreak(userId: string) {
  const streak = await ensureStreak(userId);
  if (streak.currentStreak === 0) return streak;
  const today = todayKey();
  const yesterday = addDays(today, -1);
  if (streak.lastCompletedDate && streak.lastCompletedDate !== today && streak.lastCompletedDate !== yesterday) {
    return prisma.streak.update({
      where: { userId },
      data: {
        brokenAt: addDays(streak.lastCompletedDate, 1),
        streakBeforeBreak: streak.currentStreak,
        currentStreak: 0,
      },
    });
  }
  return streak;
}

export async function getStreak(userId: string) {
  return applyLazyBreak(userId);
}

// Gọi khi 1 người vừa hoàn thành đủ 2 lượt (mở đầu + cuối ngày) của hôm nay.
export async function applyDailyCompletion(userId: string, dateKey: string) {
  const streak = await applyLazyBreak(userId);
  const yesterday = addDays(dateKey, -1);
  const continuing = streak.lastCompletedDate === yesterday;
  const nextStreak = continuing ? streak.currentStreak + 1 : 1;
  await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: nextStreak,
      longestStreak: Math.max(streak.longestStreak, nextStreak),
      lastCompletedDate: dateKey,
    },
  });
}

export async function startRepair(userId: string) {
  await ensureStreak(userId);
  await prisma.streak.update({
    where: { userId },
    data: { repairUnlockedAt: new Date(), repairProgress: 0 },
  });
}

const REPAIR_TARGET = 5;

export async function attemptRepair(userId: string, phrase: string) {
  const streak = await ensureStreak(userId);
  if (!streak.repairUnlockedAt) {
    throw new Error("Chưa xác thực khuôn mặt để bắt đầu khôi phục");
  }
  const expected = LOVE_PHRASE[streak.userId] ?? LOVE_PHRASE[userId];
  const correct = normalizePhrase(phrase) === normalizePhrase(expected);
  const progress = correct ? streak.repairProgress + 1 : 0;

  if (progress >= REPAIR_TARGET) {
    const restored = streak.streakBeforeBreak;
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: restored,
        longestStreak: Math.max(streak.longestStreak, restored),
        lastCompletedDate: todayKey(),
        brokenAt: null,
        streakBeforeBreak: 0,
        repairProgress: 0,
        repairUnlockedAt: null,
      },
    });
    return { progress: REPAIR_TARGET, repaired: true };
  }

  await prisma.streak.update({
    where: { userId },
    data: { repairProgress: progress },
  });
  return { progress, repaired: false };
}
