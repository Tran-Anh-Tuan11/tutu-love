export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const srgb = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

const INK = "#1b1030";
const PAPER = "#fbf6ee";

// Cảnh báo nếu nền mới quá sáng (khó đọc chữ --ink) hoặc quá giống màu card --paper.
export function checkBackgroundContrast(hex: string): string | null {
  const vsInk = contrastRatio(hex, INK);
  const vsPaper = contrastRatio(hex, PAPER);
  if (vsInk !== null && vsInk < 3) {
    return "Màu này quá sáng, chữ sẽ khó đọc — nên chọn màu đậm hơn.";
  }
  if (vsPaper !== null && vsPaper < 1.15) {
    return "Màu này quá giống màu card — card sẽ khó nổi lên trên nền.";
  }
  return null;
}
