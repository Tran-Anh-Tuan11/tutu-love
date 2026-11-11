"use client";

import { useState } from "react";
import { todayKey } from "@/lib/date";
import { meetCountdown, useMeetDate } from "@/lib/useMeetDate";
import { MeetCountdownCard } from "@/components/MeetCountdown";

// Thẻ trên dashboard: xem đếm ngược + đặt/đổi/bỏ ngày hẹn gặp. Dữ liệu lấy từ MeetDateProvider
// nên lưu ở đây thì banner trên cùng cập nhật theo ngay.
export default function MeetCard() {
  const { info, save } = useMeetDate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (info === null) return null;

  const today = todayKey();
  const data = meetCountdown(info, today);
  const passed = !data && !!info.meetDate;

  async function submit(meetDate: string | null) {
    setBusy(true);
    const err = await save(meetDate);
    setBusy(false);
    setError(err);
    if (!err) setEditing(false);
  }

  const form = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (draft) submit(draft);
      }}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <input
        type="date"
        value={draft}
        min={today}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="Ngày gặp nhau"
        className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
      />
      <button
        type="submit"
        disabled={busy || !draft}
        className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm disabled:opacity-50"
      >
        Lưu
      </button>
      {(data || editing) && (
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="rounded-xl border border-[var(--paper-dim)] bg-[var(--paper)] px-4 py-2 text-sm"
        >
          Hủy
        </button>
      )}
    </form>
  );

  const errorLine = error && <p className="text-center text-xs text-[var(--nu)]">{error}</p>;

  if (data) {
    return (
      <MeetCountdownCard data={data}>
        {editing ? (
          form
        ) : (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(data.meetDate);
                setEditing(true);
              }}
              className="text-xs rounded-full border border-[var(--gold)] bg-[var(--paper)] px-3 py-1"
            >
              ✏️ Đổi ngày
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(null)}
              className="text-xs rounded-full border border-[var(--gold)] bg-[var(--paper)] px-3 py-1 text-[var(--ink-soft)]"
            >
              Bỏ hẹn
            </button>
          </div>
        )}
        {errorLine}
      </MeetCountdownCard>
    );
  }

  return (
    <section className="meet-card rounded-2xl px-5 py-5 flex flex-col items-center gap-3 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--nu)]">Đếm ngày gặp nhau</p>
      <p className="font-display italic text-xl">
        {passed ? "Lần gặp vừa rồi đã qua 💞" : "Bao giờ mình gặp nhau?"}
      </p>
      <p className="text-sm text-[var(--ink-soft)]">
        {passed ? "Hẹn ngày gặp tiếp theo để đếm ngược nhé." : "Đặt ngày hẹn để cùng đếm ngược từng ngày."}
      </p>
      {form}
      {errorLine}
    </section>
  );
}
