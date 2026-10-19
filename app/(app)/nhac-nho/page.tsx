"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";
import { todayKey } from "@/lib/date";
import { useReminderTasks, type ReminderTask } from "@/lib/useReminderTasks";

type Task = ReminderTask;

function dateLabel(key: string) {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export default function ReminderTasksPage() {
  const { me } = useMe();
  // Dùng chung dữ liệu với banner/popup (qua context) — thêm/tick/xóa ở đây thì banner cập nhật theo ngay.
  const { tasks, refresh } = useReminderTasks();
  const [unlocked, setUnlocked] = useState(false);
  const [content, setContent] = useState("");
  const [remindOn, setRemindOn] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    fetch("/api/checkin")
      .then((r) => r.json())
      .then((d) => setUnlocked(!!d.myUnlockedToday));
  }, [refresh]);

  if (!me?.userId) return null;

  const today = todayKey();
  // Chưa xong: nhắc đến hạn/không hẹn ngày lên trước, rồi tới các nhắc hẹn ngày sau (gần nhất trước).
  const pending = (tasks ?? [])
    .filter((t) => !t.done)
    .sort((a, b) => (a.remindOn ?? "").localeCompare(b.remindOn ?? ""));
  const finished = (tasks ?? []).filter((t) => t.done);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setMessage(null);
    const res = await fetch("/api/reminder-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), remindOn: remindOn || null }),
    });
    if (res.ok) {
      setContent("");
      setRemindOn("");
      refresh();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Có lỗi xảy ra");
    }
  }

  async function toggle(id: string, doneNow: boolean) {
    const res = await fetch(`/api/reminder-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !doneNow }),
    });
    if (res.ok) refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/reminder-tasks/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  function renderItem(t: Task) {
    const due = t.remindOn !== null && t.remindOn <= today;
    return (
      <li key={t.id} className="flex items-center gap-3 rounded-xl bg-[var(--paper-dim)] px-3 py-2">
        <button
          onClick={() => unlocked && toggle(t.id, t.done)}
          disabled={!unlocked}
          aria-label={t.done ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}
          className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-xs ${
            t.done ? "bg-[var(--nam)] border-[var(--nam)] text-white" : "border-[var(--ink-soft)]"
          }`}
        >
          {t.done ? "✓" : ""}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${t.done ? "line-through text-[var(--ink-soft)]" : ""}`}>{t.content}</p>
          <p className="text-xs text-[var(--ink-soft)]">
            {nameOf(me?.names, t.createdBy)}
            {t.remindOn && (
              <>
                {" "}· nhắc từ {dateLabel(t.remindOn)}
                {!t.done && due && <span className="text-[var(--nu)]"> · đã đến hạn</span>}
              </>
            )}
          </p>
        </div>
        {unlocked && (
          <button onClick={() => remove(t.id)} className="text-xs text-[var(--nu)]">
            Xóa
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="paper-card p-5">
        <h1 className="font-display italic text-2xl">Việc nhắc nhở</h1>
        <p className="text-xs text-[var(--ink-soft)] mt-1">
          Việc chưa xong (và đã đến ngày nhắc) sẽ hiện trong popup mỗi lần mở app.
        </p>

        {!unlocked && (
          <p className="text-xs text-[var(--ink-soft)] mt-3">
            🔒 Mở khóa sau khi bạn xong lượt check-in mở đầu ngày.
          </p>
        )}

        <ul className="flex flex-col gap-2 mt-4">
          {tasks && pending.length === 0 && <li className="text-sm text-[var(--ink-soft)]">Chưa có nhắc nhở nào.</li>}
          {pending.map(renderItem)}
        </ul>

        {unlocked && (
          <form onSubmit={addTask} className="flex flex-col gap-2 mt-4 sm:flex-row">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cần nhắc điều gì…"
              className="flex-1 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <input
              type="date"
              value={remindOn}
              onChange={(e) => setRemindOn(e.target.value)}
              aria-label="Nhắc từ ngày (bỏ trống = nhắc ngay)"
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
              +
            </button>
          </form>
        )}
        {message && <p className="text-xs text-[var(--nu)] mt-2">{message}</p>}
      </div>

      {finished.length > 0 && (
        <div className="paper-card p-5">
          <h2 className="font-display italic text-lg">Đã xong</h2>
          <ul className="flex flex-col gap-2 mt-3">{finished.map(renderItem)}</ul>
        </div>
      )}
    </div>
  );
}
