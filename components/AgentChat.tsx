"use client";

import { useEffect, useRef, useState } from "react";
import { useMe } from "@/lib/useMe";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function AgentChat() {
  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"local" | "llm" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  if (!me?.loggedIn) return null;

  async function send() {
    const content = input.trim();
    if (!content || sending) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Có lỗi xảy ra");
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply }]);
      setMode(data.mode === "local" ? "local" : "llm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="paper-card w-[min(22rem,calc(100vw-2rem))] h-[28rem] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[var(--gold)]">
            <span className="flex items-center gap-2">
              <span className="font-display italic text-lg">Hỏi TuTu</span>
              {mode === "local" && (
                <span className="text-[10px] rounded-full bg-[var(--paper-dim)] text-[var(--ink-soft)] px-2 py-0.5">
                  bản dùng thử · chưa dùng AI
                </span>
              )}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--ink-soft)] hover:opacity-70"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--ink-soft)]">
                Hỏi mình về ngày sinh, ngày yêu nhau, ý tưởng đã lưu, chu kỳ nên ăn gì hôm nay... 🌸
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "self-end bg-[var(--gold-soft)]"
                    : "self-start bg-[var(--paper-dim)]"
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="self-start rounded-2xl px-3 py-2 text-sm bg-[var(--paper-dim)] text-[var(--ink-soft)]">
                Đang trả lời…
              </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-dashed border-[var(--gold)] px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 bg-transparent text-sm outline-none px-2 py-1.5"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full bg-[var(--gold)] text-white text-sm px-3 py-1.5 disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-[var(--gold)] text-white text-2xl shadow-lg flex items-center justify-center hover:opacity-90"
        aria-label="Mở trợ lý"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
