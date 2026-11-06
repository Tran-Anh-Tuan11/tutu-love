"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMe } from "@/lib/useMe";
import { DEFAULT_MUSIC_ID } from "@/lib/youtube";

type MusicSong = { youtubeId: string; title: string | null };

type MusicContextValue = {
  // Gọi ngay sau khi 1 người check-in thành công. Em ("nu") được phát tat-love trước,
  // hết tat-love mới vào nhạc nền; Anh ("nam") vào thẳng nhạc nền.
  startAfterCheckIn: (userId: "nam" | "nu") => void;
  // Bài nhạc nền hiện tại (null khi chưa đăng nhập / chưa tải xong).
  song: MusicSong | null;
  // true khi YouTube báo không phát được bài hiện tại (bị chặn nhúng, bị xóa...).
  playerError: boolean;
  // Đổi bài nhạc nền bằng link YouTube, dùng chung cho cả 2. Trả về lỗi (nếu có) để hiện cho người dùng.
  changeSong: (url: string) => Promise<{ error?: string }>;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const INTRO_SRC = "/tat-love.m4a";
const BGM_VOLUME = 50;

const MUTED_KEY = "tutu-love:music-muted";

function readStoredMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

// --- YouTube IFrame API (không có @types, khai báo phần dùng tới) ---
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  getPlayerState(): number;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number;
      height: number;
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: () => void;
      };
    }
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_BUFFERING = 3;

let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYoutubeApi(): Promise<YTNamespace> {
  ytApiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      ytApiPromise = null;
      reject(new Error("Không tải được YouTube player"));
    };
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

let cancelPendingGesture: (() => void) | null = null;

// Trình duyệt chặn tự phát khi trang chưa có tương tác (VD: vào app đã đăng nhập sẵn) —
// khi đó chờ lần chạm/bấm phím đầu tiên rồi phát tiếp, thay vì bỏ luôn.
function waitForGesture(retry: () => void) {
  cancelPendingGesture?.();
  const cleanup = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
    cancelPendingGesture = null;
  };
  const onGesture = () => {
    cleanup();
    retry();
  };
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  cancelPendingGesture = cleanup;
}

function playAudioOrWait(el: HTMLAudioElement) {
  el.play().catch(() => waitForGesture(() => el.play().catch(() => {})));
}

// Đặt ở root layout (không phải trong (app)) để player sống xuyên suốt khi chuyển trang —
// /login → / chuyển route client-side nên nhạc không bị ngắt.
export function MusicProvider({ children }: { children: ReactNode }) {
  const { me } = useMe();
  const loggedIn = !!me?.loggedIn;
  const introRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerPromiseRef = useRef<Promise<YTPlayer> | null>(null);
  const loadedIdRef = useRef<string | null>(null); // video đang nằm trong player
  const songPromiseRef = useRef<Promise<string> | null>(null);
  const songIdRef = useRef(DEFAULT_MUSIC_ID); // bài cần phát (theo Settings)
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const [song, setSong] = useState<MusicSong | null>(null);
  const [playerError, setPlayerError] = useState(false);
  // Nhớ lựa chọn tắt/bật tiếng của lần trước. Nút chỉ render sau khi đăng nhập (client-only) nên giá
  // trị đọc từ localStorage không làm lệch HTML hydrate.
  const [muted, setMuted] = useState(readStoredMuted);
  const mutedRef = useRef(muted);

  // Lấy bài đã chọn từ server (1 lần mỗi phiên đăng nhập). Lỗi/chưa đăng nhập → dùng bài mặc định.
  const loadSong = useCallback((): Promise<string> => {
    songPromiseRef.current ??= fetch("/api/settings/music")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { youtubeId: string; title: string | null } | null) => {
        if (!d) {
          songPromiseRef.current = null;
          return songIdRef.current;
        }
        songIdRef.current = d.youtubeId;
        setSong({ youtubeId: d.youtubeId, title: d.title });
        return d.youtubeId;
      })
      .catch(() => {
        songPromiseRef.current = null;
        return songIdRef.current;
      });
    return songPromiseRef.current;
  }, []);

  const ensurePlayer = useCallback((initialId: string): Promise<YTPlayer> => {
    playerPromiseRef.current ??= loadYoutubeApi()
      .then(
        (YT) =>
          new Promise<YTPlayer>((resolve) => {
            // Player nằm ngoài màn hình (không dùng display:none vì trình duyệt có thể không phát),
            // tạo thủ công vì YT.Player thay thẳng phần tử gốc — không để React quản lý.
            const wrap = document.createElement("div");
            wrap.setAttribute("aria-hidden", "true");
            wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:200px;height:200px;pointer-events:none;";
            const target = document.createElement("div");
            wrap.appendChild(target);
            document.body.appendChild(wrap);

            loadedIdRef.current = initialId;
            const player: YTPlayer = new YT.Player(target, {
              width: 200,
              height: 200,
              videoId: initialId,
              playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0 },
              events: {
                onReady: () => {
                  playerRef.current = player;
                  player.setVolume(BGM_VOLUME);
                  if (mutedRef.current) player.mute();
                  resolve(player);
                },
                onStateChange: (e) => {
                  if (e.data === YT_ENDED) {
                    player.seekTo(0, true);
                    player.playVideo();
                  } else if (e.data === YT_PLAYING) {
                    setPlayerError(false);
                  }
                },
                onError: () => setPlayerError(true),
              },
            });
          })
      )
      .catch((err) => {
        playerPromiseRef.current = null;
        throw err;
      });
    return playerPromiseRef.current;
  }, []);

  // Phát nhạc nền từ đầu bài. Nếu trình duyệt chặn tự phát thì chờ lần chạm đầu tiên.
  const playBgm = useCallback(async () => {
    try {
      const id = await loadSong();
      if (!startedRef.current) return;
      const player = await ensurePlayer(id);
      if (!startedRef.current) return;
      if (loadedIdRef.current !== id) {
        loadedIdRef.current = id;
        player.loadVideoById(id);
      } else {
        player.seekTo(0, true);
        player.playVideo();
      }
      if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
      verifyTimerRef.current = setTimeout(() => {
        const state = player.getPlayerState();
        if (startedRef.current && state !== YT_PLAYING && state !== YT_BUFFERING) {
          waitForGesture(() => player.playVideo());
        }
      }, 1500);
    } catch {
      // Không tải được YouTube player (offline...) — app vẫn dùng bình thường, chỉ không có nhạc nền.
    }
  }, [loadSong, ensurePlayer]);

  const stopAll = useCallback(() => {
    cancelPendingGesture?.();
    if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
    if (introRef.current) {
      introRef.current.onended = null;
      introRef.current.pause();
    }
    playerRef.current?.pauseVideo();
  }, []);

  const run = useCallback(
    (withIntro: boolean) => {
      startedRef.current = true;
      if (!introRef.current) introRef.current = new Audio(INTRO_SRC);
      const intro = introRef.current;
      intro.muted = mutedRef.current;

      // Check-in lần nữa trong ngày thì phát lại từ đầu, không chồng 2 lớp nhạc.
      stopAll();
      intro.currentTime = 0;

      if (withIntro) {
        intro.onended = () => playBgm();
        playAudioOrWait(intro);
      } else {
        playBgm();
      }
    },
    [playBgm, stopAll]
  );

  const startAfterCheckIn = useCallback((userId: "nam" | "nu") => run(userId === "nu"), [run]);

  // Vào app chính mà chưa có nhạc (đăng nhập sẵn từ trước, tải lại trang) → bật nhạc nền luôn, không
  // intro. Đăng xuất thì tắt hẳn để không còn nhạc ở trang login.
  useEffect(() => {
    if (loggedIn) {
      loadSong();
      if (!startedRef.current) run(false);
    } else if (startedRef.current) {
      startedRef.current = false;
      songPromiseRef.current = null;
      setSong(null);
      stopAll();
    }
  }, [loggedIn, run, loadSong, stopAll]);

  const changeSong = useCallback(
    async (url: string): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/settings/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? "Không đổi được nhạc" };

        songIdRef.current = data.youtubeId;
        songPromiseRef.current = Promise.resolve(data.youtubeId);
        setSong({ youtubeId: data.youtubeId, title: data.title });
        setPlayerError(false);
        // Bấm nút đổi nhạc là có tương tác thật nên được phép phát ngay; nếu đang tắt tiếng thì vẫn tắt.
        // Đang nghe intro thì thôi — hết intro sẽ tự vào bài mới.
        const intro = introRef.current;
        const introPlaying = !!intro && !intro.paused && !intro.ended;
        if (startedRef.current && !introPlaying) playBgm();
        return {};
      } catch {
        return { error: "Lỗi mạng, thử lại nhé" };
      }
    },
    [playBgm]
  );

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
    if (next) playerRef.current?.mute();
    else playerRef.current?.unMute();
  }

  const value = useMemo(
    () => ({ startAfterCheckIn, song, playerError, changeSong }),
    [startAfterCheckIn, song, playerError, changeSong]
  );

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
