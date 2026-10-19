"use client";

import { useState } from "react";
import type { ReminderTask } from "@/lib/useReminderTasks";

export type Reminder = { occasionKey: string; name: string; daysLeft: number };

// Dữ liệu do (app)/layout.tsx giữ để dùng chung với EntryPopup — banner chỉ hiển thị + báo lại.
// Ngày kỷ niệm: tắt được trong ngày. Việc nhắc nhở tự tạo: ở lại cho tới khi được tick xong.
export default function ReminderBanner({
  reminders,
  tasks,
  onDismiss,
  onCompleteTask,
}: {
  reminders: Reminder[];
  tasks: ReminderTask[];
  onDismiss: (occasionKey: string) => void;
  // Trả về lỗi (nếu có) để banner hiện ra; null = thành công.
  onCompleteTask: (id: string) => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);

  if (reminders.length === 0 && tasks.length === 0) return null;

  async function complete(id: string) {
    setError(await onCompleteTask(id));
  }

  return (
    <div className="mx-3 mt-3 md:mx-6 flex flex-col gap-2">
      {reminders.map((r) => (
        <div
          key={r.occasionKey}
          className="rounded-2xl bg-[var(--gold-soft)] px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
        >
          <span>
            💛 <strong>{r.name}</strong> — còn {r.daysLeft === 0 ? "hôm nay" : `${r.daysLeft} ngày`}
          </span>
          <button onClick={() => onDismiss(r.occasionKey)} className="text-[var(--ink-soft)] text-xs">
            Tắt hôm nay ✕
          </button>
        </div>
      ))}
      {tasks.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl bg-[var(--gold-soft)] px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
        >
          <span>
            🔔 <strong>{t.content}</strong>
          </span>
          <button
            onClick={() => complete(t.id)}
            className="shrink-0 rounded-full border border-[var(--ink-soft)] px-3 py-0.5 text-xs"
          >
            ✓ Xong rồi
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-[var(--nu)]">{error}</p>}
    </div>
  );
}
