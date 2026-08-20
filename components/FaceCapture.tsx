"use client";

import { useEffect, useRef, useState } from "react";
import { loadFaceModels } from "@/lib/faceModels";

type Props = {
  onCapture?: (descriptor: number[]) => void;
  // Gọi liên tục mỗi lần quét khung hình (kể cả khi không thấy mặt → null) — dùng cho các
  // màn hình cần theo dõi khuôn mặt trực tiếp mà không cần bấm nút chụp, VD đăng nhập bằng
  // giọng nói: người dùng chỉ cần nhìn camera và nói, không cần bấm "Chụp khuôn mặt" trước.
  onFrame?: (descriptor: number[] | null) => void;
  disabled?: boolean;
  showCaptureButton?: boolean;
};

type Status = "loading" | "no-face" | "ready" | "error";

export default function FaceCapture({ onCapture, onFrame, disabled, showCaptureButton = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastDescriptorRef = useRef<number[] | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    (async () => {
      try {
        const faceapi = await loadFaceModels();
        if (cancelled) return;

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("no-face");

        interval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (result) {
            lastDescriptorRef.current = Array.from(result.descriptor);
            setStatus("ready");
          } else {
            lastDescriptorRef.current = null;
            setStatus("no-face");
          }
          onFrameRef.current?.(lastDescriptorRef.current);
        }, 400);
      } catch {
        setStatus("error");
        setErrorMsg(
          "Không mở được camera hoặc chưa tải được mô hình nhận diện. Kiểm tra quyền camera và thử lại."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCaptureClick() {
    if (!lastDescriptorRef.current) {
      setStatus("no-face");
      setErrorMsg("Chưa thấy khuôn mặt trong khung. Thử lại ở nơi sáng hơn nhé.");
      return;
    }
    setErrorMsg(null);
    onCapture?.(lastDescriptorRef.current);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-dashed border-[var(--gold)] bg-black/5">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs px-4 bg-black/10 text-white">
            {status === "loading" && "Đang tải camera & mô hình…"}
            {status === "no-face" && "Đưa mặt vào giữa vòng tròn"}
            {status === "error" && "Lỗi camera"}
          </div>
        )}
      </div>

      <p className="text-sm text-[var(--ink-soft)]">
        {status === "ready" ? "Camera & mô hình đã sẵn sàng" : "Đưa mặt vào giữa vòng tròn"}
      </p>

      {errorMsg && <p className="text-sm text-[var(--nu)]">{errorMsg}</p>}

      {showCaptureButton && (
        <button
          type="button"
          onClick={handleCaptureClick}
          disabled={disabled || status === "loading" || status === "error"}
          className="rounded-full bg-[var(--ink)] text-[var(--paper)] px-6 py-2 text-sm font-medium disabled:opacity-40"
        >
          Chụp khuôn mặt
        </button>
      )}
    </div>
  );
}
