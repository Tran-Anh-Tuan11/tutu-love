// Bài nhạc nền mặc định khi chưa ai chọn bài trong app (Settings.musicYoutubeId = null).
export const DEFAULT_MUSIC_ID = "hGu7BVQy5G0";

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Nhận link YouTube dạng bất kỳ (watch?v=, youtu.be/, shorts/, embed/, music.youtube.com...) hoặc
// chính ID 11 ký tự, trả về ID video. Tham số `list=`/`start_radio=` bị bỏ qua — chỉ phát đúng 1 bài.
export function parseYoutubeId(input: string): string | null {
  const text = input.trim();
  if (ID_RE.test(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}
