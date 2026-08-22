"use client";

import { useState } from "react";
import { useMe } from "@/lib/useMe";

export default function NameEditor() {
  const { me, refresh } = useMe();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openEditor() {
    setDraft(me?.name ?? "");
    setMessage(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.trim() }),
      });
      if (res.ok) {
        await refresh();
        setOpen(false);
      } else {
        const d = await res.json();
        setMessage(d.error ?? "Có lỗi xảy ra");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!me?.loggedIn) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openEditor}
        aria-label="Đổi tên hiển thị"
        title="Đổi tên hiển thị"
        className="w-8 h-8 rounded-full border border-[var(--paper-dim)] flex items-center justify-center"
      >
        ✏️
      </button>
      {open && (
        <form
          onSubmit={save}
          className="absolute right-0 top-10 z-20 paper-card p-3 w-56 flex flex-col gap-2"
        >
          <p className="text-xs text-[var(--ink-soft)]">Tên hiển thị của bạn</p>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !draft.trim()}
              className="flex-1 rounded-xl bg-[var(--ink)] text-[var(--paper)] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-1.5 text-sm"
            >
              Hủy
            </button>
          </div>
          {message && <p className="text-xs text-[var(--nu)]">{message}</p>}
        </form>
      )}
    </div>
  );
}
