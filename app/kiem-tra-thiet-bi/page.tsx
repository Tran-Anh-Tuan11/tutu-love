"use client";

import { useState } from "react";
import FaceCapture from "@/components/FaceCapture";
import VoiceRepair from "@/components/VoiceRepair";

type MicStatus = "unknown" | "checking" | "granted" | "denied" | "no-device";

type SpeechWindow = Window & {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export default function DeviceCheckPage() {
  const [micStatus, setMicStatus] = useState<MicStatus>("unknown");
  const [hasFace, setHasFace] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isSecure = typeof window !== "undefined" && window.isSecureContext;
  const hasGetUserMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!((window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  async function testMic() {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
    } catch (err) {
      const name = (err as DOMException)?.name;
      setMicStatus(name === "NotFoundError" ? "no-device" : "denied");
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="paper-card p-5">
          <h1 className="font-display italic text-2xl mb-2">Kiểm tra thiết bị</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Dùng trang này để xem camera và micro có hoạt động đúng không — không cần đăng nhập.
          </p>
        </div>

        <div className="paper-card p-5 flex flex-col gap-2">
          <h2 className="font-display italic text-lg mb-1">Thông tin trình duyệt</h2>
          <ul className="text-sm flex flex-col gap-1">
            <li>Kết nối an toàn (HTTPS): {isSecure ? "✅ có" : "❌ không — camera/mic sẽ không hoạt động"}</li>
            <li>Hỗ trợ camera/mic (getUserMedia): {hasGetUserMedia ? "✅ có" : "❌ không"}</li>
            <li>Hỗ trợ nhận diện giọng nói: {hasSpeechRecognition ? "✅ có" : "❌ không — chỉ Chrome hỗ trợ tốt"}</li>
          </ul>
          <p className="text-xs text-[var(--ink-soft)] break-all mt-1">{userAgent}</p>
        </div>

        <div className="paper-card p-5 flex flex-col items-center gap-3">
          <h2 className="font-display italic text-lg self-start">Kiểm tra camera</h2>
          <FaceCapture onFrame={(d) => setHasFace(!!d)} showCaptureButton={false} />
          <p className="text-sm">
            {hasFace ? "✅ Đã thấy khuôn mặt" : "Chưa thấy khuôn mặt trong khung — đưa mặt vào giữa vòng tròn"}
          </p>
        </div>

        <div className="paper-card p-5 flex flex-col items-center gap-3">
          <h2 className="font-display italic text-lg self-start">Kiểm tra micro</h2>
          <button
            type="button"
            onClick={testMic}
            className="rounded-xl border border-[var(--paper-dim)] px-4 py-2 text-sm"
          >
            🎤 Kiểm tra quyền micro
          </button>
          {micStatus === "checking" && <p className="text-sm text-[var(--ink-soft)]">Đang kiểm tra…</p>}
          {micStatus === "granted" && <p className="text-sm text-[var(--nam)]">✅ Micro hoạt động, đã cấp quyền</p>}
          {micStatus === "denied" && (
            <p className="text-sm text-[var(--nu)]">
              ❌ Chưa được cấp quyền micro — vào cài đặt trình duyệt (hoặc cài đặt của trang này) bật quyền
              micro rồi tải lại trang.
            </p>
          )}
          {micStatus === "no-device" && (
            <p className="text-sm text-[var(--nu)]">❌ Không tìm thấy micro trên thiết bị này.</p>
          )}

          <div className="w-full pt-3 mt-1 stitch-divider-h flex flex-col items-center gap-2">
            <p className="text-sm text-[var(--ink-soft)] text-center">
              Thử nói &quot;anh yêu em&quot; hoặc &quot;em yêu anh&quot; để xem hệ thống nghe được câu gì:
            </p>
            <VoiceRepair onResult={setTranscript} onError={setVoiceError} />
            {transcript && (
              <p className="text-sm text-center">
                Nhận diện được: <strong>&quot;{transcript}&quot;</strong>
              </p>
            )}
            {voiceError && <p className="text-xs text-[var(--ink-soft)]">Mã lỗi gốc: {voiceError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
