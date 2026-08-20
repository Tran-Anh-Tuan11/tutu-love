"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";

type Todo = { id: string; content: string; done: boolean; scope: "SHARED" | "NAM" | "NU"; ownerId: string | null };
type Scope = "SHARED" | "NAM" | "NU";

const TABS: { scope: Scope; label: string }[] = [
  { scope: "SHARED", label: "Chúng ta" },
  { scope: "NAM", label: "Của Anh" },
  { scope: "NU", label: "Của Em" },
];

export default function TodoPage() {
  const { me } = useMe();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Scope>("SHARED");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((d) => setTodos(d.todos ?? []));
    fetch("/api/checkin")
      .then((r) => r.json())
      .then((d) => setUnlocked(!!d.myUnlockedToday));
  }

  useEffect(load, []);

  if (!me?.userId) return null;

  const otherScope: Scope = me.userId === "nam" ? "NU" : "NAM";
  const canWriteTab = unlocked && tab !== otherScope;
  const otherLabel = me.userId === "nam" ? "Em" : "Anh";
  const list = (todos ?? []).filter((t) => t.scope === tab);
  const done = list.filter((t) => t.done).length;

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), scope: tab }),
    });
    if (res.ok) {
      setContent("");
      load();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Có lỗi xảy ra");
    }
  }

  async function toggle(id: string, doneNow: boolean) {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !doneNow }),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="paper-card p-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display italic text-2xl">Việc cần làm chung</h1>
          {list.length > 0 && (
            <span className="text-sm text-[var(--ink-soft)] font-num">
              {done}/{list.length} xong
            </span>
          )}
        </div>

        <div className="flex gap-1 bg-[var(--paper-dim)] rounded-full p-1 text-sm mt-3 w-fit">
          {TABS.map((t) => (
            <button
              key={t.scope}
              onClick={() => setTab(t.scope)}
              className={`px-4 py-1.5 rounded-full ${tab === t.scope ? "bg-[var(--paper)] font-medium" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!unlocked && (
          <p className="text-xs text-[var(--ink-soft)] mt-3">
            🔒 Danh sách mở khóa sau khi bạn xong lượt check-in mở đầu ngày.
          </p>
        )}
        {unlocked && tab === otherScope && (
          <p className="text-xs text-[var(--ink-soft)] mt-3">🔒 Tab &quot;Của {otherLabel}&quot; chỉ {otherLabel} ghi được.</p>
        )}

        <ul className="flex flex-col gap-2 mt-4">
          {list.length === 0 && <li className="text-sm text-[var(--ink-soft)]">Chưa có việc nào.</li>}
          {list.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl bg-[var(--paper-dim)] px-3 py-2">
              <button
                onClick={() => canWriteTab && toggle(t.id, t.done)}
                disabled={!canWriteTab}
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                  t.done ? "bg-[var(--nam)] border-[var(--nam)] text-white" : "border-[var(--ink-soft)]"
                }`}
              >
                {t.done ? "✓" : ""}
              </button>
              <span className={`flex-1 text-sm ${t.done ? "line-through text-[var(--ink-soft)]" : ""}`}>
                {t.content}
              </span>
              {canWriteTab && (
                <button onClick={() => remove(t.id)} className="text-xs text-[var(--nu)]">
                  Xóa
                </button>
              )}
            </li>
          ))}
        </ul>

        {canWriteTab && (
          <form onSubmit={addTodo} className="flex gap-2 mt-4">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Thêm việc cho cả hai…"
              className="flex-1 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
              +
            </button>
          </form>
        )}
        {message && <p className="text-xs text-[var(--nu)] mt-2">{message}</p>}
      </div>
    </div>
  );
}
