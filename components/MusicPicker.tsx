"use client";

import { useState } from "react";
import { useMusic } from "@/lib/useMusic";

export default function MusicPicker() {
  const { song, playerError, changeSong } = useMusic();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || saving) return;
    setSaving(true);
    setError(null);
    const { error: err } = await changeSong(url);
    setSaving(false);
    if (err) setError(err);
    else {
      setUrl("");
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Đổi nhạc nền"
        className="w-8 h-8 rounded-full border border-[var(--paper-dim)] flex items-center justify-center"
      >
        🎶
      </button>
      {open && (
        <form onSubmit={submit} className="absolute right-0 top-10 z-20 paper-card p-3 w-72">
          <p className="text-xs text-[var(--ink-soft)] mb-1">Đổi nhạc nền — dùng chung cho cả 2</p>
          <p className="text-xs mb-2 truncate" title={song?.title ?? undefined}>
            Đang phát: {song ? (song.title ?? song.youtubeId) : "…"}
          </p>
          {playerError && (
            <p className="text-xs text-[var(--nu)] mb-2">Bài này không phát được, thử bài khác nhé.</p>
          )}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Dán link YouTube"
            disabled={saving}
            className="w-full rounded border border-[var(--paper-dim)] bg-transparent px-2 py-1.5 text-sm mb-2"
          />
          <button
            type="submit"
            disabled={saving || !url.trim()}
            className="w-full rounded-full bg-[var(--paper-dim)] py-1.5 text-sm disabled:opacity-50"
          >
            {saving ? "Đang đổi…" : "Phát bài này"}
          </button>
          {error && <p className="text-xs text-[var(--nu)] mt-2">{error}</p>}
        </form>
      )}
    </div>
  );
}
