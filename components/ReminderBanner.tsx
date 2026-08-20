"use client";

import { useEffect, useState } from "react";

type Reminder = { occasionKey: string; name: string; daysLeft: number };

export default function ReminderBanner() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((data) => setReminders(data.reminders ?? []))
      .catch(() => {});
  }, []);

  async function dismiss(occasionKey: string) {
    setReminders((rs) => rs.filter((r) => r.occasionKey !== occasionKey));
    await fetch("/api/reminders/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occasionKey }),
    });
  }

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
          <button onClick={() => dismiss(r.occasionKey)} className="text-[var(--ink-soft)] text-xs">
            Tắt hôm nay ✕
          </button>
        </div>
      ))}
    </div>
  );
}
