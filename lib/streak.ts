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

// Tính lại streak từ TOÀN BỘ lịch sử CheckIn (nguồn sự thật duy nhất) thay vì cộng dồn từng
// bước — cộng dồn từng bước từng bị lệch khi có ca đặc biệt (đứt streak rồi tự phục hồi,
// khôi phục thủ công...) vì `brokenAt`/`streakBeforeBreak` không được dọn đúng lúc. Quét lại
// toàn bộ mỗi lần luôn cho kết quả đúng, và với quy mô app này (2 người, vài năm dữ liệu) chi
// phí không đáng kể.
async function recompute(userId: string) {
  const rows = await prisma.checkIn.findMany({
    where: { userId, morningDone: true, eveningDone: true },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  let current = 0;
  let longest = 0;
  let prevDate: string | null = null;
  for (const { date } of rows) {
    current = prevDate && date === addDays(prevDate, 1) ? current + 1 : 1;
    longest = Math.max(longest, current);
    prevDate = date;
  }

  const today = todayKey();
  const yesterday = addDays(today, -1);
  const active = prevDate === today || prevDate === yesterday;

  const data = {
    currentStreak: active ? current : 0,
    longestStreak: longest,
    lastCompletedDate: prevDate,
    brokenAt: active || !prevDate ? null : addDays(prevDate, 1),
    streakBeforeBreak: active ? 0 : current,
  };

  return prisma.streak.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function getStreak(userId: string) {
  return recompute(userId);
}

// Gọi khi 1 người vừa hoàn thành đủ 2 lượt (mở đầu + cuối ngày) của hôm nay.
export async function applyDailyCompletion(userId: string) {
  await recompute(userId);
}

export async function startRepair(userId: string) {
  await recompute(userId); // đảm bảo brokenAt/streakBeforeBreak phản ánh đúng trước khi mở khôi phục
  await prisma.streak.update({
    where: { userId },
    data: { repairUnlockedAt: new Date(), repairProgress: 0 },
  });
}

const REPAIR_TARGET = 5;

export async function attemptRepair(userId: string, phrase: string) {
  const streak = await prisma.streak.upsert({ where: { userId }, create: { userId }, update: {} });
  if (!streak.repairUnlockedAt) {
    throw new Error("Chưa xác thực khuôn mặt để bắt đầu khôi phục");
  }
  const expected = LOVE_PHRASE[userId];
  const correct = normalizePhrase(phrase) === normalizePhrase(expected);
  const progress = correct ? streak.repairProgress + 1 : 0;

  if (progress >= REPAIR_TARGET) {
    const today = todayKey();

    // Đánh dấu đủ 2 lượt cho toàn bộ khoảng bị đứt (brokenAt → hôm nay) — recompute() bên
    // dưới sẽ tự tính lại streak liền mạch đúng từ lịch sử thật, không cần cộng tay số ngày.
    if (streak.brokenAt) {
      let d = streak.brokenAt;
      while (d <= today) {
        await prisma.checkIn.upsert({
          where: { date_userId: { date: d, userId } },
          create: { date: d, userId, morningDone: true, eveningDone: true },
          update: { morningDone: true, eveningDone: true },
        });
        d = addDays(d, 1);
      }
    }

    await recompute(userId);
    await prisma.streak.update({
      where: { userId },
      data: { repairProgress: 0, repairUnlockedAt: null },
    });
    return { progress: REPAIR_TARGET, repaired: true };
  }

  await prisma.streak.update({
    where: { userId },
    data: { repairProgress: progress },
  });
  return { progress, repaired: false };
}
