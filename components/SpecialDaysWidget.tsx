"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";

type Day = { occasionKey: string; name: string; date: string; daysLeft: number; type: "auto" | "custom" };

export default function SpecialDaysWidget({
  limit,
  showAddForm = false,
}: {
  limit?: number;
  showAddForm?: boolean;
}) {
  const { me } = useMe();
  const [days, setDays] = useState<Day[] | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [repeatYearly, setRepeatYearly] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/special-days")
      .then((r) => r.json())
      .then((data) => setDays(data.days ?? []))
      .catch(() => {});
  }

  useEffect(load, []);

  async function addDay(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    const [y, m, d] = date.split("-").map(Number);
    const res = await fetch("/api/special-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), month: m, day: d, year: repeatYearly ? null : y }),
    });
    if (res.ok) {
      setName("");
      setDate("");
      load();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Có lỗi xảy ra");
    }
  }

  async function removeDay(occasionKey: string) {
    const id = occasionKey.replace(/^custom-/, "");
    const res = await fetch(`/api/special-days/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const shown = limit && days ? days.slice(0, limit) : days ?? [];

  return (
    <div className="paper-card p-5 flex flex-col gap-3">
      <h2 className="font-display italic text-xl">Ngày đặc biệt</h2>

      {days === null && <p className="text-sm text-[var(--ink-soft)]">Đang tải…</p>}
      {days?.length === 0 && <p className="text-sm text-[var(--ink-soft)]">Chưa có ngày đặc biệt nào.</p>}

      <ul className="flex flex-col gap-2">
        {shown.map((d) => (
          <li
            key={d.occasionKey}
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--paper-dim)] px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-xs text-[var(--ink-soft)] font-num">
                {d.date} · {d.type === "auto" ? "Auto" : "Tự thêm"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-num text-lg badge-gold rounded-full px-2 py-0.5">
                {d.daysLeft === 0 ? "Hôm nay" : d.daysLeft}
              </span>
              {d.type === "custom" && showAddForm && (
                <button onClick={() => removeDay(d.occasionKey)} className="text-xs text-[var(--nu)]">
                  Xóa
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showAddForm && (
        <form onSubmit={addDay} className="flex flex-col gap-2 mt-2 pt-3 stitch-divider-h">
          <p className="text-xs text-[var(--ink-soft)]">Thêm ngày đặc biệt</p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Tên, VD Sinh nhật ${nameOf(me?.names, "nu")}`}
              className="flex-1 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <input type="checkbox" checked={repeatYearly} onChange={(e) => setRepeatYearly(e.target.checked)} />
            Lặp lại hàng năm
          </label>
          <button type="submit" className="self-start rounded-full bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
            + Thêm ngày
          </button>
          {message && <p className="text-xs text-[var(--nu)]">{message}</p>}
        </form>
      )}
    </div>
  );
}
