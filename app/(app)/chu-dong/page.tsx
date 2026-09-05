"use client";

import { useEffect, useRef, useState } from "react";
import { useMe } from "@/lib/useMe";
import { nameOf, type Role } from "@/lib/names";

const ROLES: Role[] = ["nam", "nu"];

// Anh (nam) 2/3, Em (nu) 1/3.
function pickWeighted(): Role {
  return Math.random() < 2 / 3 ? "nam" : "nu";
}

type LogEntry = { id: string; role: Role; date: string; createdAt: string };

export default function ProactivePage() {
  const { me } = useMe();
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Role | null>(null);
  const [result, setResult] = useState<Role | null>(null);
  const [history, setHistory] = useState<LogEntry[] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadHistory() {
    fetch("/api/proactive")
      .then((r) => r.json())
      .then((d) => setHistory(d.logs ?? []))
      .catch(() => {});
  }

  useEffect(loadHistory, []);

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
        fetch("/api/proactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: final }),
        }).then(loadHistory);
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

      <div className="paper-card p-5">
        <h2 className="font-display italic text-lg mb-3">Lịch sử</h2>
        {!history || history.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">Chưa có lượt quay nào.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between text-sm rounded-xl bg-[var(--paper-dim)] px-3 py-2"
              >
                <span className={h.role === "nam" ? "text-[var(--nam)] font-medium" : "text-[var(--nu)] font-medium"}>
                  {nameOf(me?.names, h.role)}
                </span>
                <span className="text-xs text-[var(--ink-soft)] font-num">{h.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
