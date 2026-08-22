"use client";

import { useRef, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf, type Role } from "@/lib/names";

const ROLES: Role[] = ["nam", "nu"];

// Anh (nam) 2/3, Em (nu) 1/3.
function pickWeighted(): Role {
  return Math.random() < 2 / 3 ? "nam" : "nu";
}

export default function ProactivePage() {
  const { me } = useMe();
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Role | null>(null);
  const [result, setResult] = useState<Role | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    let ticks = 0;
    const maxTicks = 14;
    intervalRef.current = setInterval(() => {
      setDisplay(ROLES[Math.floor(Math.random() * ROLES.length)]);
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

  const resultColor = result === "nam" ? "text-[var(--nam)]" : result === "nu" ? "text-[var(--nu)]" : "";
  const displayName = display ? nameOf(me?.names, display) : "?";
  const resultName = result ? nameOf(me?.names, result) : null;

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4">
      <div className="paper-card p-6 flex flex-col items-center gap-4 text-center">
        <h1 className="font-display italic text-2xl">Ai là người chủ động?</h1>
        <p className="text-sm text-[var(--ink-soft)]">Bấm quay để xem hôm nay ai chủ động trước 😏</p>

        <div className="w-40 h-40 rounded-full border-4 border-dashed border-[var(--gold)] flex items-center justify-center">
          <span className={`font-display italic text-4xl ${resultColor}`}>{displayName}</span>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="rounded-full bg-[var(--gold)] text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
        >
          {spinning ? "Đang quay…" : "🎲 Quay ngẫu nhiên"}
        </button>

        {resultName && (
          <p className="text-sm">
            Kết quả: <strong className={resultColor}>{resultName}</strong> chủ động nhé!
          </p>
        )}
      </div>
    </div>
  );
}
