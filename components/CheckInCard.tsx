"use client";

import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import VoiceRepair from "@/components/VoiceRepair";

type CheckInStatus = { morningDone: boolean; eveningDone: boolean };
type CheckInData = { nam: CheckInStatus; nu: CheckInStatus; myUnlockedToday: boolean };

export default function CheckInCard({ onCompleted }: { onCompleted?: () => void }) {
  const { me } = useMe();
  const [data, setData] = useState<CheckInData | null>(null);
  const [phrase, setPhrase] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/checkin")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }

  useEffect(load, []);

  if (!data || !me?.userId) return <div className="paper-card p-5">Đang tải…</div>;

  const mine = data[me.userId];
  const other = me.userId === "nam" ? data.nu : data.nam;
  const otherLabel = me.userId === "nam" ? "Em" : "Anh";
  const hour = new Date().getHours();
  const after18 = hour >= 18;

  let phase: "morning" | "evening" | "done" | "wait-evening" = "done";
  if (!mine.morningDone) phase = "morning";
  else if (!mine.eveningDone) phase = after18 ? "evening" : "wait-evening";

  async function submit(text: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase: text }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage("Đã ghi lời yêu thương hôm nay 💛");
        setPhrase("");
        load();
        onCompleted?.();
      } else {
        setMessage(result.error ?? "Có lỗi xảy ra");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paper-card p-5 flex flex-col gap-3">
      <h2 className="font-display italic text-xl">Check-in lời yêu thương</h2>
      <p className="text-xs text-[var(--ink-soft)]">Hai lượt mỗi ngày: mở đầu và cuối ngày</p>

      <div className="flex gap-4 text-sm">
        <span className={mine.morningDone ? "text-[var(--nam)]" : "text-[var(--ink-soft)]"}>
          {mine.morningDone ? "✓" : "○"} Mở đầu ngày (bạn)
        </span>
        <span className={mine.eveningDone ? "text-[var(--nam)]" : "text-[var(--ink-soft)]"}>
          {mine.eveningDone ? "✓" : "○"} Cuối ngày (bạn)
        </span>
      </div>
      <p className="text-xs text-[var(--ink-soft)]">
        {otherLabel}: {other.morningDone ? "✓ mở đầu" : "○ mở đầu"} · {other.eveningDone ? "✓ cuối ngày" : "○ cuối ngày"}
      </p>

      {phase === "done" && <p className="text-sm text-[var(--nam)]">Đã hoàn thành đủ 2 lượt hôm nay ❤️</p>}
      {phase === "wait-evening" && (
        <p className="text-sm text-[var(--ink-soft)]">Lượt cuối ngày mở sau 18h — quay lại nhé.</p>
      )}

      {(phase === "morning" || phase === "evening") && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Hôm nay {me.userId === "nam" ? "anh" : "em"} muốn nói với người kia điều gì?
          </p>
          <div className="flex gap-2">
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={me.userId === "nam" ? "anh yêu em" : "em yêu anh"}
              className="flex-1 rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <button
              onClick={() => submit(phrase)}
              disabled={busy || !phrase.trim()}
              className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm disabled:opacity-40"
            >
              Gửi
            </button>
          </div>
          <VoiceRepair onResult={(t) => { setPhrase(t); submit(t); }} />
        </div>
      )}

      {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
    </div>
  );
}
