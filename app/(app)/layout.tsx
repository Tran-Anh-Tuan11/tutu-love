"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ReminderBanner, { type Reminder } from "@/components/ReminderBanner";
import EntryPopup, { type PendingTodo } from "@/components/EntryPopup";
import AgentChat from "@/components/AgentChat";
import { todayKey } from "@/lib/date";
import { dueReminderTasks, ReminderTasksProvider, useReminderTasks } from "@/lib/useReminderTasks";
import { useMe } from "@/lib/useMe";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me && !me.loggedIn) {
      router.replace("/login");
    }
  }, [loading, me, router]);

  if (loading || !me?.loggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--ink-soft)]">
        Đang kiểm tra đăng nhập…
      </div>
    );
  }

  return (
    <ReminderTasksProvider>
      <AppShell>{children}</AppShell>
    </ReminderTasksProvider>
  );
}

type PopupState = "pending" | "open" | "closed";

// Chỉ mount khi đã đăng nhập, và mount lại khi vào app (đăng nhập xong / tải lại trang) chứ không
// mount lại khi chuyển trang trong (app) — nên popup chỉ hiện đúng 1 lần mỗi lượt vào app.
function AppShell({ children }: { children: React.ReactNode }) {
  const { tasks, refresh: refreshTasks } = useReminderTasks();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pendingTodos, setPendingTodos] = useState<PendingTodo[]>([]);
  // Quyết định hiện popup hay không được chốt MỘT LẦN lúc vào app — thêm nhắc nhở mới sau đó
  // không được tự bật popup lên lại.
  const [popup, setPopup] = useState<PopupState>("pending");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/reminders")
        .then((r) => r.json())
        .then((d) => (d.reminders ?? []) as Reminder[])
        .catch(() => [] as Reminder[]),
      fetch("/api/todos")
        .then((r) => r.json())
        // Chỉ tính việc của Anh/Em như PendingTodosWidget, bỏ việc chung.
        .then((d) =>
          ((d.todos ?? []) as (PendingTodo & { done: boolean })[]).filter((t) => !t.done && t.scope !== "SHARED")
        )
        .catch(() => [] as PendingTodo[]),
      refreshTasks(),
    ]).then(([rs, ts, allTasks]) => {
      if (!active) return;
      setReminders(rs);
      setPendingTodos(ts);
      const hasDue = dueReminderTasks(allTasks, todayKey()).length > 0;
      setPopup(rs.length > 0 || ts.length > 0 || hasDue ? "open" : "closed");
    });
    return () => {
      active = false;
    };
  }, [refreshTasks]);

  const closePopup = useCallback(() => setPopup("closed"), []);

  async function dismissReminder(occasionKey: string) {
    setReminders((rs) => rs.filter((r) => r.occasionKey !== occasionKey));
    await fetch("/api/reminders/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occasionKey }),
    });
  }

  async function completeTask(id: string): Promise<string | null> {
    const res = await fetch(`/api/reminder-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return d.error ?? "Có lỗi xảy ra";
    }
    await refreshTasks();
    return null;
  }

  const dueTasks = dueReminderTasks(tasks, todayKey());
  const popupOpen = popup === "open";

  return (
    <div className="flex flex-col flex-1">
      <Header />
      {/* Đang mở popup thì nhắc nhở nằm trong popup; đóng rồi mới thu gọn thành banner, và việc
          nhắc nhở ở lại banner cho tới khi được tick xong. Chưa chốt xong popup thì chưa hiện banner. */}
      {popup === "closed" && (
        <ReminderBanner
          reminders={reminders}
          tasks={dueTasks}
          onDismiss={dismissReminder}
          onCompleteTask={completeTask}
        />
      )}
      <main className="flex-1 px-3 py-4 md:px-6 md:py-6">{children}</main>
      <AgentChat />
      {popupOpen && <EntryPopup reminders={reminders} tasks={dueTasks} todos={pendingTodos} onClose={closePopup} />}
    </div>
  );
}
