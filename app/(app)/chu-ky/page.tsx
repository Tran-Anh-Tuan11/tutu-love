"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import { NAM_TIP, PHASE_LABEL, type CyclePhase } from "@/lib/period";

type Prediction = {
  dayOfCycle: number;
  phase: CyclePhase;
  daysToNextPeriod: number;
  nextPeriodDate: string;
  cycleLength: number;
};
type FoodSuggestion = { label: string; items: string };
type PeriodData = {
  log: { startDate: string; cycleLength: number; periodLength: number } | null;
  prediction: Prediction | null;
  phase: CyclePhase | null;
  foodSuggestions: FoodSuggestion[];
};

export default function PeriodPage() {
  const { me } = useMe();
  const [data, setData] = useState<PeriodData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/period")
      .then((r) => r.json())
      .then(setData);
  }
  useEffect(load, []);

  async function logNew(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) return;
    const res = await fetch("/api/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, cycleLength, periodLength }),
    });
    if (res.ok) {
      setStartDate("");
      load();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Có lỗi xảy ra");
    }
  }

  if (!data) return <div className="paper-card p-5 max-w-2xl mx-auto">Đang tải…</div>;

  const { prediction, phase, foodSuggestions } = data;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="paper-card p-5">
        <h1 className="font-display italic text-2xl mb-3">Đến kỳ &amp; ăn gì</h1>

        {!prediction && <p className="text-sm text-[var(--ink-soft)]">Chưa có dữ liệu chu kỳ nào được ghi.</p>}

        {prediction && (
          <div className="flex flex-wrap gap-6 items-baseline">
            <div>
              <p className="text-xs badge-nu inline-block rounded-full px-2 py-0.5 mb-1">
                {phase && PHASE_LABEL[phase]} · ngày {prediction.dayOfCycle}
              </p>
              <p className="font-num text-4xl">{prediction.daysToNextPeriod}</p>
              <p className="text-xs text-[var(--ink-soft)]">ngày tới kỳ sau ({prediction.nextPeriodDate})</p>
            </div>
            <div className="text-xs text-[var(--ink-soft)] flex flex-col gap-0.5">
              <span>Kinh nguyệt · ngày 1–{data.log?.periodLength}</span>
              <span>Rụng trứng · ✨ khoảng ngày {prediction.cycleLength - 14}</span>
              <span>Độ dài trung bình · {prediction.cycleLength} ngày</span>
            </div>
          </div>
        )}

        {me?.userId === "nu" && (
          <form onSubmit={logNew} className="flex flex-wrap gap-2 mt-4 pt-4 stitch-divider-h">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <input
              type="number"
              min={1}
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              title="Độ dài chu kỳ (ngày)"
              className="w-24 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <input
              type="number"
              min={1}
              value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              title="Số ngày hành kinh"
              className="w-24 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button type="submit" className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm">
              Ghi kỳ mới
            </button>
          </form>
        )}
        {me?.userId === "nam" && (
          <p className="text-xs text-[var(--ink-soft)] mt-4 pt-4 stitch-divider-h">
            Chỉ Nữ ghi được kỳ mới — bạn xem để biết mà chăm nhau.
          </p>
        )}
        {message && <p className="text-xs text-[var(--nu)] mt-2">{message}</p>}
      </div>

      {phase && (
        <div className="paper-card p-5">
          <h2 className="font-display italic text-xl mb-3">Hôm nay ăn gì</h2>
          <p className="text-sm badge-gold inline-block rounded-full px-2 py-0.5 mb-3">{PHASE_LABEL[phase]}</p>
          <ul className="flex flex-col gap-2">
            {foodSuggestions.map((f) => (
              <li key={f.label} className="text-sm">
                <strong>{f.label}:</strong> {f.items}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--ink-soft)] mt-3">
            Chỉ mang tính tham khảo, không thay thế tư vấn y tế.
          </p>

          {me?.userId === "nam" && (
            <p className="text-sm mt-4 pt-4 stitch-divider-h">
              <strong>Nam nên làm gì hôm nay:</strong> {NAM_TIP[phase]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
