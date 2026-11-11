"use client";

import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";
import { formatMeetDate, type MeetCountdownData } from "@/lib/useMeetDate";

function Avatar({ role, name, small }: { role: "nam" | "nu"; name: string; small?: boolean }) {
  return (
    <span
      title={name}
      className={`flex items-center justify-center rounded-full text-white font-medium shadow-sm ring-2 ring-[var(--paper)] ${
        small ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs"
      }`}
      style={{ background: role === "nam" ? "var(--nam)" : "var(--nu)" }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

// Đường chỉ khâu với Anh ở đầu trái, Em ở đầu phải — càng gần ngày gặp, hai người càng tiến lại
// gần trái tim ở giữa.
function MeetTrack({ progress, small }: { progress: number; small?: boolean }) {
  const { me } = useMe();
  // Khoảng lùi để lúc progress = 1 hai avatar đứng sát hai bên trái tim chứ không đè lên nó.
  const inset = small ? 30 : 40;
  const offset = `calc(${progress.toFixed(3)} * (50% - ${inset}px))`;
  return (
    <div className={`relative ${small ? "h-5" : "h-8"}`} aria-hidden="true">
      <div className="absolute inset-x-2 top-1/2 border-t-2 border-dashed border-[var(--gold)] opacity-70" />
      <div className="meet-move absolute top-1/2 -translate-y-1/2" style={{ left: offset }}>
        <Avatar role="nam" name={nameOf(me?.names, "nam")} small={small} />
      </div>
      <div className="meet-move absolute top-1/2 -translate-y-1/2" style={{ right: offset }}>
        <Avatar role="nu" name={nameOf(me?.names, "nu")} small={small} />
      </div>
      <span
        className={`meet-heart absolute left-1/2 top-1/2 leading-none ${small ? "text-sm" : "text-xl"}`}
      >
        💗
      </span>
    </div>
  );
}

// Thẻ lớn — dùng trong popup lúc vào app và trên dashboard.
export function MeetCountdownCard({ data, children }: { data: MeetCountdownData; children?: React.ReactNode }) {
  const today = data.daysLeft === 0;
  return (
    <section
      className="meet-card relative overflow-hidden rounded-2xl px-5 py-5 flex flex-col gap-4"
      aria-label={today ? "Hôm nay gặp nhau" : `Còn ${data.daysLeft} ngày nữa gặp nhau`}
    >
      <span className="meet-float absolute right-4 top-3 text-lg opacity-60" aria-hidden="true">
        💕
      </span>
      <span className="meet-float meet-float-late absolute left-4 bottom-12 text-sm opacity-40" aria-hidden="true">
        ✨
      </span>

      <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--nu)]">Đếm ngày gặp nhau</p>

      {today ? (
        <div className="text-center">
          <p className="font-display italic text-3xl text-[var(--nu)]">Hôm nay gặp nhau rồi!</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Chờ mãi cũng tới ngày này 💞</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-[var(--ink-soft)]">Còn</p>
          <div className="flex items-end gap-1.5">
            {String(data.daysLeft)
              .split("")
              .map((digit, i) => (
                <span
                  key={i}
                  className="meet-digit font-num text-5xl leading-none rounded-xl px-3 py-2.5 text-[var(--ink)]"
                >
                  {digit}
                </span>
              ))}
            <span className="font-display italic text-2xl pb-1.5 pl-1">ngày</span>
          </div>
          <p className="font-display italic text-lg text-[var(--ink)]">nữa là mình gặp nhau</p>
        </div>
      )}

      <MeetTrack progress={data.progress} />

      <p className="text-center text-xs text-[var(--ink-soft)]">
        Ngày hẹn · <span className="font-num text-[var(--ink)]">{formatMeetDate(data.meetDate)}</span>
      </p>

      {children}
    </section>
  );
}

// Dải mỏng trên cùng mọi trang trong app.
export function MeetCountdownBanner({ data }: { data: MeetCountdownData }) {
  const today = data.daysLeft === 0;
  return (
    <div className="meet-card rounded-2xl px-4 py-2.5 flex items-center gap-x-4 gap-y-2 flex-wrap">
      <p className="text-sm flex items-baseline gap-1.5 flex-wrap">
        {today ? (
          <span className="font-display italic text-base text-[var(--nu)]">Hôm nay gặp nhau rồi! 💞</span>
        ) : (
          <>
            <span className="text-[var(--ink-soft)]">Còn</span>
            <span className="meet-digit font-num text-lg leading-none rounded-lg px-2 py-1">{data.daysLeft}</span>
            <span className="font-display italic text-base">ngày nữa là gặp nhau</span>
          </>
        )}
      </p>
      <div className="flex-1 min-w-[140px]">
        <MeetTrack progress={data.progress} small />
      </div>
      <span className="font-num text-xs text-[var(--ink-soft)]">{formatMeetDate(data.meetDate)}</span>
    </div>
  );
}
