"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ReminderBanner, { type Reminder } from "@/components/ReminderBanner";
import EntryPopup, { type DueReminderTask, type PendingTodo } from "@/components/EntryPopup";
import AgentChat from "@/components/AgentChat";
import { todayKey } from "@/lib/date";
import { useMe } from "@/lib/useMe";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const router = useRouter();
  const loggedIn = !!me?.loggedIn;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pendingTodos, setPendingTodos] = useState<PendingTodo[]>([]);
  const [dueTasks, setDueTasks] = useState<DueReminderTask[]>([]);
  const [entryLoaded, setEntryLoaded] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);

  useEffect(() => {
    if (!loading && me && !me.loggedIn) {
      router.replace("/login");
    }
  }, [loading, me, router]);

  // Layout này chỉ mount lại khi vào app (đăng nhập xong / tải lại trang), không mount lại khi
  // chuyển trang trong (app) — nên popup chỉ hiện đúng 1 lần mỗi lượt vào app.
  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    Promise.all([
      fetch("/api/reminders")
        .then((r) => r.json())
        .then((d) => (d.reminders ?? []) as Reminder[])
        .catch(() => [] as Reminder[]),
      fetch("/api/todos")
        .then((r) => r.json())
        .then((d) => ((d.todos ?? []) as (PendingTodo & { done: boolean })[]).filter((t) => !t.done))
        .catch(() => [] as PendingTodo[]),
      // Việc nhắc nhở tự tạo: chưa xong và đã đến ngày nhắc (hoặc không hẹn ngày).
      fetch("/api/reminder-tasks")
        .then((r) => r.json())
        .then((d) => {
          const today = todayKey();
          return ((d.tasks ?? []) as (DueReminderTask & { done: boolean })[]).filter(
            (t) => !t.done && (t.remindOn === null || t.remindOn <= today)
          );
        })
        .catch(() => [] as DueReminderTask[]),
    ]).then(([rs, ts, tasks]) => {
      if (!active) return;
      setReminders(rs);
      setPendingTodos(ts);
      setDueTasks(tasks);
      setEntryLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [loggedIn]);

  const closePopup = useCallback(() => setPopupClosed(true), []);

  async function dismissReminder(occasionKey: string) {
    setReminders((rs) => rs.filter((r) => r.occasionKey !== occasionKey));
    await fetch("/api/reminders/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occasionKey }),
    });
  }

  if (loading || !me?.loggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--ink-soft)]">
        Đang kiểm tra đăng nhập…
      </div>
    );
  }

  // Popup chỉ hiện khi thật sự có gì để nhắc (chỉ tính việc của Anh/Em như PendingTodosWidget).
  const popupTodos = pendingTodos.filter((t) => t.scope !== "SHARED");
  const popupOpen =
    entryLoaded && !popupClosed && (reminders.length > 0 || dueTasks.length > 0 || popupTodos.length > 0);

  return (
    <div className="flex flex-col flex-1">
      <Header />
      {/* Đang mở popup thì nhắc nhở nằm trong popup; đóng rồi mới thu gọn thành banner. */}
      {!popupOpen && <ReminderBanner reminders={reminders} onDismiss={dismissReminder} />}
      <main className="flex-1 px-3 py-4 md:px-6 md:py-6">{children}</main>
      <AgentChat />
      {popupOpen && <EntryPopup reminders={reminders} tasks={dueTasks} todos={popupTodos} onClose={closePopup} />}
    </div>
  );
}
