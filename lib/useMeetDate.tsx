"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { daysBetween } from "@/lib/date";

export type MeetInfo = { meetDate: string | null; setOn: string | null };

export type MeetCountdownData = {
  meetDate: string;
  daysLeft: number; // 0 = hôm nay gặp
  progress: number; // 0..1 — đã đi được bao nhiêu phần quãng chờ kể từ ngày đặt lịch
};

// null khi chưa hẹn hoặc ngày hẹn đã qua — mọi nơi hiển thị (popup, banner, dashboard) dùng chung.
export function meetCountdown(info: MeetInfo | null, today: string): MeetCountdownData | null {
  if (!info?.meetDate) return null;
  const daysLeft = daysBetween(today, info.meetDate);
  if (daysLeft < 0) return null;
  const total = info.setOn ? daysBetween(info.setOn, info.meetDate) : 0;
  const progress = total > 0 ? Math.min(1, Math.max(0, (total - daysLeft) / total)) : daysLeft === 0 ? 1 : 0;
  return { meetDate: info.meetDate, daysLeft, progress };
}

// "2026-12-24" → "Thứ Năm, 24/12/2026". Tự tính thứ từ chuỗi ngày (qua Date.UTC) để không lệ thuộc
// timezone của máy.
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export function formatMeetDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

type Value = {
  info: MeetInfo | null; // null = chưa tải xong
  refresh: () => Promise<MeetInfo>;
  // Trả về lỗi (nếu có); null = thành công.
  save: (meetDate: string | null) => Promise<string | null>;
};

const MeetDateContext = createContext<Value | null>(null);

// Một nguồn dữ liệu duy nhất cho popup, banner và thẻ trên dashboard — đổi ngày ở dashboard thì
// banner cập nhật theo ngay. Provider không tự fetch: (app)/layout gọi refresh() lúc vào app.
export function MeetDateProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<MeetInfo | null>(null);

  const refresh = useCallback(async () => {
    const empty: MeetInfo = { meetDate: null, setOn: null };
    try {
      const res = await fetch("/api/meet");
      const d = await res.json();
      const next: MeetInfo = res.ok ? { meetDate: d.meetDate ?? null, setOn: d.setOn ?? null } : empty;
      setInfo(next);
      return next;
    } catch {
      setInfo(empty);
      return empty;
    }
  }, []);

  const save = useCallback(async (meetDate: string | null) => {
    try {
      const res = await fetch("/api/meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetDate }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return (d.error as string | undefined) ?? "Có lỗi xảy ra";
      setInfo({ meetDate: d.meetDate ?? null, setOn: d.setOn ?? null });
      return null;
    } catch {
      return "Không kết nối được, thử lại nhé";
    }
  }, []);

  const value = useMemo(() => ({ info, refresh, save }), [info, refresh, save]);
  return <MeetDateContext.Provider value={value}>{children}</MeetDateContext.Provider>;
}

export function useMeetDate(): Value {
  const ctx = useContext(MeetDateContext);
  if (!ctx) throw new Error("useMeetDate phải được gọi trong <MeetDateProvider>");
  return ctx;
}
