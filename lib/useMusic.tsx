"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMe } from "@/lib/useMe";

type MusicContextValue = {
  // Gọi ngay sau khi 1 người check-in thành công. Em ("nu") được phát tat-love trước,
  // hết tat-love mới vào nhạc nền Limo; Anh ("nam") vào thẳng Limo.
  startAfterCheckIn: (userId: "nam" | "nu") => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const INTRO_SRC = "/tat-love.m4a";
const BGM_SRC = "/Limo.mp3";

const MUTED_KEY = "tutu-love:music-muted";

function readStoredMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

let cancelPendingGesture: (() => void) | null = null;

// Trình duyệt chặn tự phát khi trang chưa có tương tác (VD: vào app đã đăng nhập sẵn) —
// khi đó chờ lần chạm/bấm phím đầu tiên rồi phát tiếp, thay vì bỏ luôn.
function playOrWaitForGesture(el: HTMLAudioElement) {
  el.play().catch(() => {
    cancelPendingGesture?.();
    const cleanup = () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      cancelPendingGesture = null;
    };
    const retry = () => {
      cleanup();
      el.play().catch(() => {});
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    cancelPendingGesture = cleanup;
  });
}

// Đặt ở root layout (không phải trong (app)) để <audio> sống xuyên suốt khi chuyển trang —
// /login → / chuyển route client-side nên nhạc không bị ngắt.
export function MusicProvider({ children }: { children: ReactNode }) {
  const { me } = useMe();
  const loggedIn = !!me?.loggedIn;
  const introRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  // Nhớ lựa chọn tắt/bật tiếng của lần trước. Nút chỉ render sau khi đăng nhập (client-only) nên giá
  // trị đọc từ localStorage không làm lệch HTML hydrate.
  const [muted, setMuted] = useState(readStoredMuted);
  const mutedRef = useRef(muted);

  const run = useCallback((withIntro: boolean) => {
    startedRef.current = true;
    if (!bgmRef.current) {
      const bgm = new Audio(BGM_SRC);
      bgm.loop = true;
      bgm.volume = 0.5;
      bgmRef.current = bgm;
    }
    if (!introRef.current) introRef.current = new Audio(INTRO_SRC);
    const bgm = bgmRef.current;
    const intro = introRef.current;
    bgm.muted = mutedRef.current;
    intro.muted = mutedRef.current;

    // Check-in lần nữa trong ngày thì phát lại từ đầu, không chồng 2 lớp nhạc.
    cancelPendingGesture?.();
    intro.onended = null;
    intro.pause();
    intro.currentTime = 0;
    bgm.pause();
    bgm.currentTime = 0;

    if (withIntro) {
      intro.onended = () => playOrWaitForGesture(bgm);
      playOrWaitForGesture(intro);
    } else {
      playOrWaitForGesture(bgm);
    }
  }, []);

  const startAfterCheckIn = useCallback(
    (userId: "nam" | "nu") => run(userId === "nu"),
    [run]
  );

  // Vào app chính mà chưa có nhạc (đăng nhập sẵn từ trước, tải lại trang) → bật Limo luôn, không
  // intro. Đăng xuất thì tắt hẳn để không còn nhạc ở trang login.
  useEffect(() => {
    if (loggedIn) {
      if (!startedRef.current) run(false);
    } else if (startedRef.current) {
      startedRef.current = false;
      cancelPendingGesture?.();
      introRef.current?.pause();
      bgmRef.current?.pause();
    }
  }, [loggedIn, run]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    try {
      localStorage.setItem(MUTED_KEY, next ? "1" : "0");
    } catch {
      // localStorage có thể bị chặn (chế độ riêng tư...) — chỉ mất việc ghi nhớ, không ảnh hưởng nhạc.
    }
    if (introRef.current) introRef.current.muted = next;
    if (bgmRef.current) bgmRef.current.muted = next;
  }

  const value = useMemo(() => ({ startAfterCheckIn }), [startAfterCheckIn]);

  return (
    <MusicContext.Provider value={value}>
      {children}
      {loggedIn && (
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
