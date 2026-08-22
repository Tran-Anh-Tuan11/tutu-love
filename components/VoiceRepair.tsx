"use client";

import { useEffect, useRef, useState } from "react";

type SpeechErrorEvent = { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  abort: () => void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
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

// Mã lỗi từ Web Speech API — dịch ra tiếng Việt dễ hiểu để biết chính xác vì sao mic không ăn.
const ERROR_LABEL: Record<string, string> = {
  "not-allowed": "Chưa được cấp quyền micro — vào cài đặt trình duyệt bật quyền micro cho trang này rồi tải lại.",
  "no-speech": "Không nghe thấy gì — thử nói to hơn hoặc để mic gần miệng hơn.",
  "audio-capture": "Không tìm thấy micro trên thiết bị này.",
  network: "Lỗi mạng khi nhận diện giọng nói — kiểm tra kết nối internet.",
  aborted: "Đã hủy nghe.",
  "service-not-allowed": "Trình duyệt chặn dịch vụ nhận diện giọng nói.",
};

type Props = {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
};

export default function VoiceRepair({ onResult, onError }: Props) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const [listening, setListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supported = getSpeechRecognitionCtor() !== null;

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      setErrorMsg(null);
      const transcript = e.results[0][0].transcript;
      onResultRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      setListening(false);
      setErrorMsg(ERROR_LABEL[e.error] ?? `Lỗi nhận diện giọng nói: ${e.error}`);
      onErrorRef.current?.(e.error);
    };
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  function startListening() {
    if (recognitionRef.current && !listening) {
      setErrorMsg(null);
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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={startListening}
        disabled={listening}
        className="rounded-full bg-[var(--gold)] text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
      >
        {listening ? "Đang nghe…" : "🎙 Nhấn để nói"}
      </button>
      {errorMsg && <p className="text-xs text-[var(--nu)] text-center">{errorMsg}</p>}
    </div>
  );
}
