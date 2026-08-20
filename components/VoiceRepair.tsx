"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

// Đọc trực tiếp lúc render (không qua state+effect) — window.SpeechRecognition không đổi
// trong đời component nên không cần đồng bộ hóa, tránh vi phạm rule "no setState in effect".
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as SpeechWindow;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

type Props = {
  onResult: (transcript: string) => void;
};

export default function VoiceRepair({ onResult }: Props) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const [listening, setListening] = useState(false);
  const supported = getSpeechRecognitionCtor() !== null;

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResultRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  function startListening() {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        // no-op: start() ném lỗi nếu gọi khi đang chạy, bỏ qua an toàn
      }
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-[var(--nu)]">
        Trình duyệt này chưa hỗ trợ nhận diện giọng nói (chỉ Chrome hỗ trợ tốt). Bạn có thể gõ câu thay
        thế ở ô bên dưới.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={listening}
      className="rounded-full bg-[var(--gold)] text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
    >
      {listening ? "Đang nghe…" : "🎙 Nhấn để nói"}
    </button>
  );
}
