"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import CheckInCard from "@/components/CheckInCard";
import StreakCard from "@/components/StreakCard";
import SpecialDaysWidget from "@/components/SpecialDaysWidget";
import RelationshipStartEditor from "@/components/RelationshipStartEditor";
import PendingTodosWidget from "@/components/PendingTodosWidget";

function greetingFor(name: string | null, hour: number) {
  const time = hour < 11 ? "buổi sáng" : hour < 14 ? "buổi trưa" : hour < 18 ? "buổi chiều" : "buổi tối";
  return `Chào ${time}, ${name ?? ""} 👋`;
}

export default function DashboardPage() {
  const { me } = useMe();
  const [relationshipStart, setRelationshipStart] = useState<string | null>(null);
  const [daysTogether, setDaysTogether] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    // Đưa new Date() vào sau 1 microtask để không gọi hàm impure trực tiếp trong effect.
    Promise.resolve().then(() => setNow(new Date()));
  }, []);

  function handleRelationshipChange(value: string | null) {
    setRelationshipStart(value);
    setDaysTogether(value ? Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)) : null);
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

        <div className="mt-3 pt-3 stitch-divider-h">
          <RelationshipStartEditor onChange={handleRelationshipChange} />
        </div>
        {daysTogether !== null && (
          <p className="mt-3">
            <span className="font-num text-4xl">{daysTogether}</span>{" "}
            <span className="text-sm text-[var(--ink-soft)]">ngày bên nhau · từ {relationshipStart}</span>
          </p>
        )}
      </div>

      <CheckInCard onCompleted={() => setRefreshSignal((s) => s + 1)} />
      <StreakCard refreshSignal={refreshSignal} />
      <PendingTodosWidget />
      <SpecialDaysWidget limit={3} />
    </div>
  );
}
