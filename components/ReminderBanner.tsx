"use client";

export type Reminder = { occasionKey: string; name: string; daysLeft: number };

// Dữ liệu do (app)/layout.tsx giữ để dùng chung với EntryPopup — banner chỉ hiển thị + báo tắt.
export default function ReminderBanner({
  reminders,
  onDismiss,
}: {
  reminders: Reminder[];
  onDismiss: (occasionKey: string) => void;
}) {
  if (reminders.length === 0) return null;

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
    </div>
  );
}
