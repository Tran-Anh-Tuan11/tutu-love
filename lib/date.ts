// Mọi "ngày" trong app là chuỗi "YYYY-MM-DD" theo giờ local của server,
// tránh lệch timezone khi so sánh ngày với DateTime UTC.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function daysBetween(fromKey: string, toKeyStr: string): number {
  const a = parseDateKey(fromKey);
  const b = parseDateKey(toKeyStr);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Cuối ngày hôm nay theo giờ local (23:59:59.999) — dùng làm hạn cookie session.
export function endOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isAfter18h(): boolean {
  return new Date().getHours() >= 18;
}
