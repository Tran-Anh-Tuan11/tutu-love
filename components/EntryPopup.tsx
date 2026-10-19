"use client";

import { useEffect } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";
import type { Reminder } from "@/components/ReminderBanner";

export type PendingTodo = { id: string; content: string; done: boolean; scope: "SHARED" | "NAM" | "NU" };

// Popup nhắc nhở lúc mới vào app: gộp việc chưa làm + ngày kỉ niệm sắp tới. Đóng popup thì việc
// chưa làm vẫn nằm ở PendingTodosWidget trên dashboard, còn nhắc nhở chuyển thành ReminderBanner.
export type DueReminderTask = { id: string; content: string; remindOn: string | null; createdBy: "nam" | "nu" };

export default function EntryPopup({
  reminders,
  tasks,
  todos,
  onClose,
}: {
  reminders: Reminder[];
  tasks: DueReminderTask[];
  todos: PendingTodo[];
  onClose: () => void;
}) {
  const { me } = useMe();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sections = [
    { title: `Việc của ${nameOf(me?.names, "nam")}`, items: todos.filter((t) => t.scope === "NAM") },
    { title: `Việc của ${nameOf(me?.names, "nu")}`, items: todos.filter((t) => t.scope === "NU") },
  ].filter((s) => s.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nhắc nhở hôm nay"
        className="paper-card w-full max-w-md max-h-[80vh] overflow-y-auto p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display italic text-xl">Nhắc nhở hôm nay</h2>

        {reminders.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Ngày đặc biệt sắp tới</p>
            <ul className="flex flex-col gap-1.5">
              {reminders.map((r) => (
                <li key={r.occasionKey} className="text-sm rounded-xl bg-[var(--gold-soft)] px-3 py-2">
                  💛 <strong>{r.name}</strong> — còn {r.daysLeft === 0 ? "hôm nay" : `${r.daysLeft} ngày`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Việc nhắc nhở</p>
            <ul className="flex flex-col gap-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="text-sm rounded-xl bg-[var(--gold-soft)] px-3 py-2">
                  🔔 {t.content}
                  <span className="text-xs text-[var(--ink-soft)]"> · {nameOf(me?.names, t.createdBy)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sections.map((s) => (
          <div key={s.title} className="flex flex-col gap-2">
            <p className="text-sm font-medium">{s.title}</p>
            <ul className="flex flex-col gap-1.5">
              {s.items.map((t) => (
                <li key={t.id} className="text-sm rounded-xl bg-[var(--paper-dim)] px-3 py-2">
                  {t.content}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm"
        >
          Đã biết rồi
        </button>
      </div>
    </div>
  );
}
