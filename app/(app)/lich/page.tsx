"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";

type Scope = "nam" | "nu" | "chung";
type DayCell = { date: string; status: "none" | "partial" | "full" };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function statusDot(status: DayCell["status"]) {
  if (status === "full") return <span className="text-base">❤️</span>;
  if (status === "partial") return <span className="w-2.5 h-2.5 rounded-full bg-[var(--cal-partial)]" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-[var(--cal-none)]" />;
}

export default function CalendarPage() {
  const { me } = useMe();
  const TABS: { scope: Scope; label: string }[] = [
    { scope: "chung", label: "Chúng ta" },
    { scope: "nam", label: `Của ${nameOf(me?.names, "nam")}` },
    { scope: "nu", label: `Của ${nameOf(me?.names, "nu")}` },
  ];
  const [tab, setTab] = useState<Scope>("chung");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [days, setDays] = useState<DayCell[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/calendar/${tab}?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setDays(d.days ?? []);
      });
    return () => {
      active = false;
    };
  }, [tab, year, month]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const firstWeekday = days && days.length > 0 ? (new Date(days[0].date).getDay() + 6) % 7 : 0;
  const leadingBlanks = Array.from({ length: firstWeekday });

  const full = days?.filter((d) => d.status === "full").length ?? 0;
  const partial = days?.filter((d) => d.status === "partial").length ?? 0;
  const none = days?.filter((d) => d.status === "none").length ?? 0;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="paper-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display italic text-2xl">Lịch check-in</h1>
          <div className="flex items-center gap-3 font-num text-sm">
            <button onClick={() => shiftMonth(-1)} aria-label="Tháng trước">
              ‹
            </button>
            <span>
              Tháng {month} · {year}
            </span>
            <button onClick={() => shiftMonth(1)} aria-label="Tháng sau">
              ›
            </button>
          </div>
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

        <div className="grid grid-cols-7 gap-1 mt-4 text-center text-xs text-[var(--ink-soft)]">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-1">
          {leadingBlanks.map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {days?.map((d) => (
            <div
              key={d.date}
              className="aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg bg-[var(--paper-dim)]"
            >
              <span className="text-xs font-num">{Number(d.date.slice(-2))}</span>
              {statusDot(d.status)}
            </div>
          ))}
        </div>

        {days && (
          <p className="text-xs text-[var(--ink-soft)] mt-3 flex gap-3 flex-wrap">
            <span>❤️ Đủ hai lượt · {full}</span>
            <span>🟢 Một phần · {partial}</span>
            <span>🟠 Trống · {none}</span>
          </p>
        )}
      </div>
    </div>
  );
}
