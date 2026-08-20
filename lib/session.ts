import { cookies } from "next/headers";
import crypto from "crypto";
import { endOfTodayLocal, todayKey } from "@/lib/date";

const COOKIE_NAME = "session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET chưa được cấu hình trong .env");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

// Session hết hạn vào cuối ngày hôm nay (giờ local) — không phải TTL cố định,
// nên payload phải mang theo mốc hết hạn để verify không phụ thuộc đồng hồ client.
export type SessionPayload = { userId: string; exp: number; issuedOn: string };

function encode(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (sign(body) !== sig) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const exp = endOfTodayLocal();
  const payload: SessionPayload = { userId, exp: exp.getTime(), issuedOn: todayKey() };
  const token = encode(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: exp,
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  // Cookie hết hạn vào cuối ngày hôm nay: nếu đã sang ngày mới (hoặc quá exp), coi như hết session.
  if (Date.now() > payload.exp || payload.issuedOn !== todayKey()) return null;
  return { userId: payload.userId };
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
