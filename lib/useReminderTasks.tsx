"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ReminderTask = {
  id: string;
  content: string;
  remindOn: string | null;
  done: boolean;
  createdBy: "nam" | "nu";
};

// Chưa xong và đã đến ngày nhắc (hoặc không hẹn ngày) — dùng chung cho popup + banner.
export function dueReminderTasks(tasks: ReminderTask[] | null, today: string): ReminderTask[] {
  return (tasks ?? []).filter((t) => !t.done && (t.remindOn === null || t.remindOn <= today));
}

type Value = { tasks: ReminderTask[] | null; refresh: () => Promise<ReminderTask[]> };

const ReminderTasksContext = createContext<Value | null>(null);

// Một nguồn dữ liệu duy nhất cho banner, popup và trang /nhac-nho — tick xong/thêm/xóa ở đâu thì
// gọi refresh() để mọi nơi cập nhật theo. Provider không tự fetch: (app)/layout gọi refresh() lúc vào app.
export function ReminderTasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<ReminderTask[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/reminder-tasks");
      const d = await res.json();
      const list = (d.tasks ?? []) as ReminderTask[];
      setTasks(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const value = useMemo(() => ({ tasks, refresh }), [tasks, refresh]);
  return <ReminderTasksContext.Provider value={value}>{children}</ReminderTasksContext.Provider>;
}

export function useReminderTasks(): Value {
  const ctx = useContext(ReminderTasksContext);
  if (!ctx) throw new Error("useReminderTasks phải được gọi trong <ReminderTasksProvider>");
  return ctx;
}
