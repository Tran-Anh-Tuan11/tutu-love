"use client";

import { useState } from "react";

const PRESETS = [
  { name: "Hồng phấn", hex: "#f7d9de" },
  { name: "Kem be", hex: "#f2e8d5" },
  { name: "Xanh sage nhạt", hex: "#dbe6dc" },
  { name: "Lavender nhạt", hex: "#e6dff0" },
];

export default function BackgroundPicker() {
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function apply(hex: string) {
    setSaving(true);
    setWarning(null);
    try {
      const res = await fetch("/api/settings/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: hex }),
      });
      const data = await res.json();
      if (res.ok) {
        document.documentElement.style.setProperty("--bg", hex);
        setWarning(data.warning ?? null);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Đổi màu nền"
        className="w-8 h-8 rounded-full border border-[var(--paper-dim)] flex items-center justify-center"
      >
        🎨
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 paper-card p-3 w-56">
          <p className="text-xs text-[var(--ink-soft)] mb-2">Đổi màu nền — dùng chung cho cả 2</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.hex}
                title={p.name}
                onClick={() => apply(p.hex)}
                disabled={saving}
                className="w-9 h-9 rounded-full border border-black/10"
                style={{ background: p.hex }}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            Tự chọn
            <input
              type="color"
              onChange={(e) => apply(e.target.value)}
              disabled={saving}
              className="w-8 h-8 rounded border-none bg-transparent"
            />
          </label>
          {warning && <p className="text-xs text-[var(--nu)] mt-2">{warning}</p>}
        </div>
      )}
    </div>
  );
}
