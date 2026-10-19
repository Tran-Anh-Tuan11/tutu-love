"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type MusicContextValue = {
  // Gọi ngay sau khi 1 người check-in thành công. Em ("nu") được phát tat-love trước,
  // hết tat-love mới vào nhạc nền Limo; Anh ("nam") vào thẳng Limo.
  startAfterCheckIn: (userId: "nam" | "nu") => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const INTRO_SRC = "/tat-love.m4a";
const BGM_SRC = "/Limo.mp3";

// Đặt ở root layout (không phải trong (app)) để <audio> sống xuyên suốt khi chuyển trang —
// /login → / chuyển route client-side nên nhạc không bị ngắt.
export function MusicProvider({ children }: { children: ReactNode }) {
  const introRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  const startAfterCheckIn = useCallback((userId: "nam" | "nu") => {
    if (!bgmRef.current) {
      const bgm = new Audio(BGM_SRC);
      bgm.loop = true;
      bgm.volume = 0.5;
      bgmRef.current = bgm;
    }
    const bgm = bgmRef.current;
    const intro = introRef.current ?? new Audio(INTRO_SRC);
    introRef.current = intro;

    // Check-in lần nữa trong ngày thì phát lại từ đầu, không chồng 2 lớp nhạc.
    intro.pause();
    intro.currentTime = 0;
    bgm.pause();
    bgm.currentTime = 0;
    intro.onended = null;

    // Trình duyệt có thể từ chối tự phát (chưa có tương tác) — bỏ qua im lặng, không làm hỏng check-in.
    const playBgm = () => void bgm.play().catch(() => {});
    if (userId === "nu") {
      intro.onended = playBgm;
      intro.play().catch(() => {});
    } else {
      playBgm();
    }
    setStarted(true);
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (introRef.current) introRef.current.muted = next;
    if (bgmRef.current) bgmRef.current.muted = next;
  }

  const value = useMemo(() => ({ startAfterCheckIn }), [startAfterCheckIn]);

  return (
    <MusicContext.Provider value={value}>
      {children}
      {started && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Bật nhạc nền" : "Tắt nhạc nền"}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-[var(--paper)] border border-[var(--paper-dim)] w-10 h-10 text-lg shadow"
        >
          {muted ? "🔇" : "🎵"}
        </button>
      )}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic phải được gọi trong <MusicProvider>");
  return ctx;
}
