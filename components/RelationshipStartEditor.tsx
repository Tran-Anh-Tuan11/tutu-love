"use client";

import { useEffect, useState } from "react";

type Props = {
  onChange?: (value: string | null) => void;
};

export default function RelationshipStartEditor({ onChange }: Props) {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/relationship")
      .then((r) => r.json())
      .then((d) => {
        setValue(d.relationshipStart);
        onChange?.(d.relationshipStart);
      });
    // Chỉ báo lên parent lúc tải xong lần đầu — các lần đổi sau báo qua save() để tránh
    // vòng lặp effect khi onChange được truyền vào dạng inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const res = await fetch("/api/relationship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: draft }),
    });
    if (res.ok) {
      const data = await res.json();
      setValue(data.relationshipStart);
      onChange?.(data.relationshipStart);
      setEditing(false);
    }
  }

  if (value === undefined) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--ink-soft)]">
          {value ? (
            <>Ngày yêu nhau · <span className="font-num text-[var(--ink)]">{value}</span></>
          ) : (
            "Chưa đặt ngày yêu nhau"
          )}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(value ?? "");
              setEditing(true);
            }}
            className="text-xs rounded-full border border-[var(--paper-dim)] px-3 py-1"
          >
            {value ? "✏️ Đổi ngày" : "+ Đặt ngày"}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="flex gap-2">
          <input
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
          />
          <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
            Lưu
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-xl border border-[var(--paper-dim)] px-4 py-2 text-sm"
          >
            Hủy
          </button>
        </form>
      )}
    </div>
  );
}
