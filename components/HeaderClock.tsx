"use client";

import { useEffect, useState } from "react";

const VN_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
});
const SH_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Shanghai",
  hour: "2-digit",
  minute: "2-digit",
});

export default function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Đưa new Date() vào sau 1 microtask cho lần đầu, giống quy ước ở Dashboard, để không
    // gọi hàm impure trực tiếp trong thân effect.
    Promise.resolve().then(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div className="flex items-center gap-2 text-xs font-num text-[var(--ink-soft)] shrink-0">
      <span title="Giờ Việt Nam">🇻🇳 {VN_FORMAT.format(now)}</span>
      <span aria-hidden>·</span>
      <span title="Giờ Thượng Hải">🇨🇳 {SH_FORMAT.format(now)}</span>
    </div>
  );
}
