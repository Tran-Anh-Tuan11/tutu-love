"use client";

import { useRef, useState } from "react";

type Result = "Anh" | "Em";
const NAMES: Result[] = ["Anh", "Em"];

// Anh 2/3, Em 1/3.
function pickWeighted(): Result {
  return Math.random() < 2 / 3 ? "Anh" : "Em";
}

export default function ProactivePage() {
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Result | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    let ticks = 0;
    const maxTicks = 14;
    intervalRef.current = setInterval(() => {
      setDisplay(NAMES[Math.floor(Math.random() * NAMES.length)]);
      ticks += 1;
      if (ticks >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const final = pickWeighted();
        setDisplay(final);
        setResult(final);
        setSpinning(false);
      }
    }, 100);
  }

  const resultColor = result === "Anh" ? "text-[var(--nam)]" : result === "Em" ? "text-[var(--nu)]" : "";

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4">
      <div className="paper-card p-6 flex flex-col items-center gap-4 text-center">
        <h1 className="font-display italic text-2xl">Ai là người chủ động?</h1>
        <p className="text-sm text-[var(--ink-soft)]">Bấm quay để xem hôm nay ai chủ động trước 😏</p>

        <div className="w-40 h-40 rounded-full border-4 border-dashed border-[var(--gold)] flex items-center justify-center">
          <span className={`font-display italic text-4xl ${resultColor}`}>{display ?? "?"}</span>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="rounded-full bg-[var(--gold)] text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
        >
          {spinning ? "Đang quay…" : "🎲 Quay ngẫu nhiên"}
        </button>

        {result && (
          <p className="text-sm">
            Kết quả: <strong className={resultColor}>{result}</strong> chủ động nhé!
          </p>
        )}
      </div>
    </div>
  );
}
