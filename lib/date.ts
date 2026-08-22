// Mọi "ngày"/"giờ" nghiệp vụ trong app (mốc sang ngày mới, giờ mở lượt cuối ngày...) luôn
// tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè) — cố định múi giờ này bất kể máy chạy
// code ở đâu, vì Vercel chạy theo UTC còn máy dev có thể ở múi giờ khác.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// "Đồng hồ treo tường" giờ VN của 1 thời điểm — cộng offset rồi đọc bằng getUTC* để không
// phụ thuộc timezone thật của máy chạy.
function vnWallClock(instant: Date): Date {
  return new Date(instant.getTime() + VN_OFFSET_MS);
}

export function toDateKey(d: Date): string {
  const vn = vnWallClock(d);
  return `${vn.getUTCFullYear()}-${pad(vn.getUTCMonth() + 1)}-${pad(vn.getUTCDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

// Mốc UTC tuyệt đối tương ứng 00:00 giờ VN của ngày "YYYY-MM-DD" — dùng Date.UTC (không dùng
// constructor local) để các phép +ngày/so sánh sau đó nhất quán, không lệ thuộc timezone máy chạy.
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - VN_OFFSET_MS);
}

export function addDays(key: string, days: number): string {
  const instant = parseDateKey(key).getTime() + days * 86_400_000;
  return toDateKey(new Date(instant));
}

export function daysBetween(fromKey: string, toKeyStr: string): number {
  const ms = parseDateKey(toKeyStr).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(ms / 86_400_000);
}

// Cuối ngày hôm nay theo giờ VN (23:59:59.999 VN) — dùng làm hạn cookie session.
export function endOfTodayLocal(): Date {
  const [y, m, d] = todayKey().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - VN_OFFSET_MS);
}

export function isAfter18h(): boolean {
  return vnWallClock(new Date()).getUTCHours() >= 18;
}
