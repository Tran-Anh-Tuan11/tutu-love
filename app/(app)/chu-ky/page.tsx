"use client";

import { useEffect, useRef, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";
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

// Mỗi dòng file: "YYYY-MM-DD" hoặc "YYYY-MM-DD,độDàiChuKỳ,sốNgàyHànhKinh" — dùng để nhập
// nhiều kỳ trong quá khứ cùng lúc thay vì gõ tay từng kỳ.
function parsePeriodFile(text: string): { startDate: string; cycleLength?: number; periodLength?: number }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [startDate, cycleLength, periodLength] = line.split(",").map((s) => s.trim());
      return {
        startDate,
        cycleLength: cycleLength ? Number(cycleLength) : undefined,
        periodLength: periodLength ? Number(periodLength) : undefined,
      };
    });
}

export default function PeriodPage() {
  const { me } = useMe();
  const [data, setData] = useState<PeriodData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    try {
      const text = await file.text();
      const entries = parsePeriodFile(text);
      const res = await fetch("/api/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage(`Đã nhập ${d.imported} kỳ từ file.`);
        load();
      } else {
        setMessage(d.error ?? "Có lỗi xảy ra");
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-[var(--paper-dim)] px-4 py-2 text-sm"
          >
            📄 Nhập từ file
          </button>
          <span className="text-xs text-[var(--ink-soft)]">
            mỗi dòng: YYYY-MM-DD hoặc YYYY-MM-DD,độDàiChuKỳ,sốNgàyHànhKinh
          </span>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={importFile} className="hidden" />
        </div>

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
              <strong>{nameOf(me.names, "nam")} nên làm gì hôm nay:</strong> {NAM_TIP[phase]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
