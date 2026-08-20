"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import CheckInCard from "@/components/CheckInCard";
import StreakCard from "@/components/StreakCard";
import SpecialDaysWidget from "@/components/SpecialDaysWidget";

function greetingFor(name: string | null, hour: number) {
  const time = hour < 11 ? "buổi sáng" : hour < 14 ? "buổi trưa" : hour < 18 ? "buổi chiều" : "buổi tối";
  return `Chào ${time}, ${name ?? ""} 👋`;
}

export default function DashboardPage() {
  const { me } = useMe();
  const [relationshipStart, setRelationshipStart] = useState<string | null | undefined>(undefined);
  const [daysTogether, setDaysTogether] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    // Đưa new Date() vào sau 1 microtask để không gọi hàm impure trực tiếp trong effect.
    Promise.resolve().then(() => setNow(new Date()));

    fetch("/api/relationship")
      .then((r) => r.json())
      .then((d) => {
        setRelationshipStart(d.relationshipStart);
        if (d.relationshipStart) {
          setDaysTogether(
            Math.round((Date.now() - new Date(d.relationshipStart).getTime()) / (1000 * 60 * 60 * 24))
          );
        }
      });
  }, []);

  async function saveStart(e: React.FormEvent) {
    e.preventDefault();
    if (!draftDate) return;
    const res = await fetch("/api/relationship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: draftDate }),
    });
    if (res.ok) {
      const data = await res.json();
      setRelationshipStart(data.relationshipStart);
      setDaysTogether(Math.round((Date.now() - new Date(data.relationshipStart).getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  const todayLabel = now?.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="paper-card p-5">
        <h1 className="font-display italic text-2xl">{greetingFor(me?.name ?? null, now?.getHours() ?? 12)}</h1>
        {todayLabel && <p className="text-sm text-[var(--ink-soft)] capitalize">{todayLabel}</p>}

        {relationshipStart === null && (
          <form onSubmit={saveStart} className="flex gap-2 mt-3">
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
              Đặt ngày bắt đầu yêu nhau
            </button>
          </form>
        )}
        {daysTogether !== null && (
          <p className="mt-3">
            <span className="font-num text-4xl">{daysTogether}</span>{" "}
            <span className="text-sm text-[var(--ink-soft)]">ngày bên nhau · từ {relationshipStart}</span>
          </p>
        )}
      </div>

      <CheckInCard onCompleted={() => setRefreshSignal((s) => s + 1)} />
      <StreakCard refreshSignal={refreshSignal} />
      <SpecialDaysWidget limit={3} />
    </div>
  );
}
