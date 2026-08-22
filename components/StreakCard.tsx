"use client";

import { useCallback, useEffect, useState } from "react";
import FaceCapture from "@/components/FaceCapture";
import VoiceRepair from "@/components/VoiceRepair";

type StreakData = { current: number; longest: number; broken: boolean; streakBeforeBreak: number };

export default function StreakCard({ refreshSignal }: { refreshSignal?: number }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [stage, setStage] = useState<"idle" | "verify" | "repair" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(load, [load, refreshSignal]);

  async function handleReverify(descriptor: number[]) {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descriptor }),
    });
    const result = await res.json();
    if (!result.matched) {
      setMessage("Không nhận diện được khuôn mặt, thử lại nhé.");
      return;
    }
    await fetch("/api/streak/repair/start", { method: "POST" });
    setStage("repair");
    setProgress(0);
    setMessage(null);
  }

  async function attempt(text: string) {
    const res = await fetch("/api/streak/repair/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase: text }),
    });
    const result = await res.json();
    setPhrase("");
    if (result.repaired) {
      setStage("done");
      setMessage("Đã khôi phục streak! 🎉");
      load();
    } else {
      setProgress(result.progress ?? 0);
      if ((result.progress ?? 0) === 0) {
        setMessage("Chưa đúng câu — nói/gõ lại đủ 5 lần liên tiếp nhé.");
      } else {
        setMessage(null);
      }
    }
  }

  if (!data) return <div className="paper-card p-5">Đang tải…</div>;

  return (
    <div className="paper-card p-5 flex flex-col gap-3">
      <h2 className="font-display italic text-xl">Streak điểm danh</h2>

      {stage === "idle" && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-num text-4xl">{data.current}</span>
            <span className="text-sm text-[var(--ink-soft)]">ngày · kỷ lục {data.longest}</span>
          </div>
          {data.broken && (
            <>
              <p className="text-sm text-[var(--nu)]">Chuỗi bị đứt — trước đó bạn có {data.streakBeforeBreak} ngày.</p>
              <button
                onClick={() => setStage("verify")}
                className="self-start rounded-full bg-[var(--gold)] text-white px-4 py-2 text-sm"
              >
                Khôi phục streak
              </button>
            </>
          )}
        </>
      )}

      {stage === "verify" && (
        <>
          <p className="text-sm text-[var(--ink-soft)]">Xác thực khuôn mặt trước khi khôi phục</p>
          <FaceCapture onCapture={handleReverify} />
        </>
      )}

      {stage === "repair" && (
        <>
          <p className="text-sm">
            Nói đúng câu của bạn <strong>{progress}/5</strong> lần liên tiếp để khôi phục streak.
          </p>
          <VoiceRepair onResult={attempt} />
          <div className="flex gap-2">
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="hoặc gõ câu của bạn"
              className="flex-1 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button
              onClick={() => attempt(phrase)}
              disabled={!phrase.trim()}
              className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm disabled:opacity-40"
            >
              Gửi
            </button>
          </div>
        </>
      )}

      {stage === "done" && <p className="text-sm text-[var(--nam)]">Streak được khôi phục 🎉</p>}

      {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
    </div>
  );
}
