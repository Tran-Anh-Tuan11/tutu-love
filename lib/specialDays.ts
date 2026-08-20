import { prisma } from "@/lib/prisma";
import { daysBetween, parseDateKey, todayKey, toDateKey } from "@/lib/date";

export type SpecialDayItem = {
  occasionKey: string;
  name: string;
  date: string; // YYYY-MM-DD của lần xảy ra kế tiếp
  daysLeft: number;
  type: "auto" | "custom";
};

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function clampDay(year: number, month1to12: number, day: number): number {
  return Math.min(day, daysInMonth(year, month1to12));
}

// Lần xảy ra kế tiếp (>= hôm nay) của một ngày lặp hàng năm.
function nextYearlyDate(month1to12: number, day: number, fromKey: string): string {
  const today = parseDateKey(fromKey);
  let year = today.getFullYear();
  let candidate = new Date(year, month1to12 - 1, clampDay(year, month1to12, day));
  if (toDateKey(candidate) < fromKey) {
    year += 1;
    candidate = new Date(year, month1to12 - 1, clampDay(year, month1to12, day));
  }
  return toDateKey(candidate);
}

// Lần xảy ra kế tiếp (>= hôm nay) của một ngày lặp hàng tháng (theo ngày-trong-tháng).
function nextMonthlyDate(day: number, fromKey: string): string {
  const today = parseDateKey(fromKey);
  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  let candidate = new Date(year, month - 1, clampDay(year, month, day));
  if (toDateKey(candidate) < fromKey) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    candidate = new Date(year, month - 1, clampDay(year, month, day));
  }
  return toDateKey(candidate);
}

export async function getSpecialDays(): Promise<SpecialDayItem[]> {
  const today = todayKey();
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const items: SpecialDayItem[] = [];

  // Valentine — lặp hàng năm, không phụ thuộc ngày yêu nhau.
  const valentineDate = nextYearlyDate(2, 14, today);
  items.push({
    occasionKey: "valentine",
    name: "Valentine",
    date: valentineDate,
    daysLeft: daysBetween(today, valentineDate),
    type: "auto",
  });

  if (settings?.relationshipStart) {
    const start = parseDateKey(settings.relationshipStart);
    const startDay = start.getDate();
    const startMonth = start.getMonth() + 1;

    const monthlyDate = nextMonthlyDate(startDay, today);
    items.push({
      occasionKey: `monthly-${monthlyDate}`,
      name: "Kỷ niệm hàng tháng",
      date: monthlyDate,
      daysLeft: daysBetween(today, monthlyDate),
      type: "auto",
    });

    const yearlyDate = nextYearlyDate(startMonth, startDay, today);
    items.push({
      occasionKey: `yearly-${yearlyDate}`,
      name: "Kỷ niệm yêu nhau",
      date: yearlyDate,
      daysLeft: daysBetween(today, yearlyDate),
      type: "auto",
    });
  }

  const customs = await prisma.specialDay.findMany();
  for (const c of customs) {
    if (c.year != null) {
      // Chỉ 1 lần — chỉ hiển thị nếu chưa qua.
      const date = toDateKey(new Date(c.year, c.month - 1, c.day));
      if (date < today) continue;
      items.push({
        occasionKey: `custom-${c.id}`,
        name: c.name,
        date,
        daysLeft: daysBetween(today, date),
        type: "custom",
      });
    } else {
      const date = nextYearlyDate(c.month, c.day, today);
      items.push({
        occasionKey: `custom-${c.id}`,
        name: c.name,
        date,
        daysLeft: daysBetween(today, date),
        type: "custom",
      });
    }
  }

  items.sort((a, b) => a.daysLeft - b.daysLeft);
  return items;
}
