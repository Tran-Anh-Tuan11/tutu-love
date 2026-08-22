"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FaceCapture from "@/components/FaceCapture";
import VoiceRepair from "@/components/VoiceRepair";
import { useMe } from "@/lib/useMe";
import { nameOf } from "@/lib/names";

type Tab = "verify" | "enroll";

export default function LoginPage() {
  const router = useRouter();
  const { me, refresh } = useMe();
  // Chưa đăng ký khuôn mặt đủ cho cả Anh và Em thì luôn ở tab "Cài đặt lần đầu" —
  // tab "Xác thực" chỉ mở khi có đủ 2 người để xác thực với.
  const bothRegistered = !!me?.enrollment.nam && !!me?.enrollment.nu;
  const namName = nameOf(me?.names, "nam");
  const nuName = nameOf(me?.names, "nu");
  const [tab, setTab] = useState<Tab>("verify");
  const effectiveTab: Tab = bothRegistered ? tab : "enroll";
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Đăng nhập trong 1 bước duy nhất: camera theo dõi khuôn mặt liên tục ở nền (không cần
  // bấm chụp), người dùng chỉ cần vừa nhìn camera vừa nói/gõ đúng lời yêu thương — lượt
  // đăng nhập này tính luôn thành 1 lượt check-in cho streak.
  const descriptorRef = useRef<number[] | null>(null);
  const [hasFace, setHasFace] = useState(false);
  const [phrase, setPhrase] = useState("");

  // Form cài đặt lần đầu
  const [role, setRole] = useState<"nam" | "nu">("nam");
  const [name, setName] = useState("");
  const [setupKey, setSetupKey] = useState("");

  useEffect(() => {
    if (me?.loggedIn) router.replace("/");
  }, [me, router]);

  function handleFrame(d: number[] | null) {
    descriptorRef.current = d;
    setHasFace(!!d);
  }

  async function submitLogin(text: string) {
    if (!text.trim()) return;
    if (!descriptorRef.current) {
      setMessage("Chưa thấy khuôn mặt trong khung — nhìn vào camera rồi thử lại.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor: descriptorRef.current, phrase: text }),
      });
      const data = await res.json();
      if (data.matched && data.phraseOk) {
        await refresh();
        router.replace("/");
      } else if (data.matched) {
        setPhrase("");
        setMessage(data.error ?? "Câu chưa đúng, thử lại nhé.");
      } else {
        setMessage("Chưa nhận diện được khuôn mặt nào khớp — thử lại ở nơi sáng hơn nhé.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEnroll(descriptor: number[]) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: role, name, descriptor, setupKey }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = await refresh();
        const stillMissing = role === "nam" ? !updated.enrollment.nu : !updated.enrollment.nam;
        setMessage(
          stillMissing
            ? `Đã lưu khuôn mặt cho ${name || role}. Còn thiếu người kia — đăng ký tiếp rồi mới xác thực được.`
            : `Đã lưu khuôn mặt cho ${name || role}. Đủ 2 người rồi, chuyển sang tab Xác thực để đăng nhập.`
        );
      } else {
        setMessage(data.error ?? "Có lỗi xảy ra");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="paper-card w-full max-w-md p-6 flex flex-col items-center gap-4">
        <h1 className="font-display italic text-2xl text-center">
          TuTu &amp; Love
        </h1>
        <p className="text-sm text-[var(--ink-soft)] text-center">
          Một cuốn nhật ký khóa kín. Hai khuôn mặt là hai chiếc chìa khóa duy nhất.
        </p>

        <div className="flex gap-3 text-xs">
          <span className={`px-2 py-1 rounded-full ${me?.enrollment.nam ? "badge-nam" : "bg-[var(--paper-dim)]"}`}>
            {namName} · {me?.enrollment.nam ? "đã đăng ký" : "chưa đăng ký"}
          </span>
          <span className={`px-2 py-1 rounded-full ${me?.enrollment.nu ? "badge-nu" : "bg-[var(--paper-dim)]"}`}>
            {nuName} · {me?.enrollment.nu ? "đã đăng ký" : "chưa đăng ký"}
          </span>
        </div>

        <div className="flex gap-1 bg-[var(--paper-dim)] rounded-full p-1 text-sm">
          <button
            onClick={() => bothRegistered && setTab("verify")}
            disabled={!bothRegistered}
            title={bothRegistered ? undefined : `Cần đăng ký khuôn mặt cho cả ${namName} và ${nuName} trước`}
            className={`px-4 py-1.5 rounded-full ${effectiveTab === "verify" ? "bg-[var(--paper)] font-medium" : ""} ${
              bothRegistered ? "" : "opacity-40 cursor-not-allowed"
            }`}
          >
            Xác thực
          </button>
          <button
            onClick={() => setTab("enroll")}
            className={`px-4 py-1.5 rounded-full ${effectiveTab === "enroll" ? "bg-[var(--paper)] font-medium" : ""}`}
          >
            Cài đặt lần đầu
          </button>
        </div>

        {!bothRegistered && (
          <p className="text-xs text-[var(--ink-soft)] text-center">
            Cần đăng ký khuôn mặt cho cả {namName} và {nuName} trước khi xác thực đăng nhập.
          </p>
        )}

        {effectiveTab === "verify" && (
          <div className="w-full flex flex-col items-center gap-3">
            <FaceCapture onFrame={handleFrame} disabled={busy} showCaptureButton={false} />
            <p className="text-xs text-[var(--ink-soft)] text-center">
              Hệ thống tự nhận diện là {namName} hay {nuName} — cứ nhìn camera rồi nói luôn lời yêu thương, không cần bấm chụp
            </p>

            <VoiceRepair onResult={(t) => { setPhrase(t); submitLogin(t); }} />
            <div className="flex gap-2 w-full">
              <p className="flex-1 flex items-center rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white min-h-[2.5rem]">
                {phrase || <span className="text-[var(--ink-soft)]">Chưa nghe được câu nào — bấm nói ở trên</span>}
              </p>
              <button
                onClick={() => submitLogin(phrase)}
                disabled={busy || !phrase.trim() || !hasFace}
                className="rounded-xl bg-[var(--ink)] text-[var(--paper)] px-4 py-2 text-sm disabled:opacity-40"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        )}

        {effectiveTab === "enroll" && (
          <div className="w-full flex flex-col gap-3">
            <div className="flex gap-2">
              {(["nam", "nu"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-xl py-2 text-sm border ${
                    role === r ? (r === "nam" ? "badge-nam border-[var(--nam)]" : "badge-nu border-[var(--nu)]") : "border-[var(--paper-dim)]"
                  }`}
                >
                  {r === "nam" ? namName : nuName}
                </button>
              ))}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tên hiển thị, VD "Tuấn"'
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <input
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="Setup key"
              type="password"
              className="rounded-xl border border-[var(--paper-dim)] px-3 py-2 text-sm bg-white"
            />
            <FaceCapture onCapture={handleEnroll} disabled={busy || !name.trim() || !setupKey} />
          </div>
        )}

        {message && <p className="text-sm text-center text-[var(--ink-soft)]">{message}</p>}
      </div>
    </div>
  );
}
