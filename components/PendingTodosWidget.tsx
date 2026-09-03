"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";

type Todo = { id: string; content: string; done: boolean; scope: "SHARED" | "NAM" | "NU"; ownerId: string | null };

// Chỉ hiển thị — không bấm/sửa được ở đây, phải sang /viec mới chỉnh sửa được.
function PendingList({ title, items }: { title: string; items: Todo[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--ink-soft)]">Không còn việc nào 🎉</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((t) => (
            <li key={t.id} className="text-sm rounded-xl bg-[var(--paper-dim)] px-3 py-2">
              {t.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PendingTodosWidget() {
  const { me } = useMe();
  const [todos, setTodos] = useState<Todo[] | null>(null);

  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((d) => setTodos(d.todos ?? []))
      .catch(() => {});
  }, []);

  if (!todos) return null;

  const namPending = todos.filter((t) => t.scope === "NAM" && !t.done);
  const nuPending = todos.filter((t) => t.scope === "NU" && !t.done);

  return (
    <div className="paper-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display italic text-xl">Việc chưa làm</h2>
        <Link href="/viec" className="text-xs text-[var(--ink-soft)] underline">
          Chỉnh sửa ở đây
        </Link>
      </div>

      <PendingList title={`Của ${nameOf(me?.names, "nam")}`} items={namPending} />
      <PendingList title={`Của ${nameOf(me?.names, "nu")}`} items={nuPending} />
    </div>
  );
}
