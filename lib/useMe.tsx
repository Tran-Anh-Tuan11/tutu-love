"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Me = {
  loggedIn: boolean;
  userId: "nam" | "nu" | null;
  name: string | null;
  enrollment: { nam: boolean; nu: boolean };
  names: { nam: string | null; nu: string | null };
};

const LOGGED_OUT: Me = {
  loggedIn: false,
  userId: null,
  name: null,
  enrollment: { nam: false, nu: false },
  names: { nam: null, nu: null },
};

async function fetchMe(): Promise<Me> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return LOGGED_OUT;
    return await res.json();
  } catch {
    // Lỗi mạng — coi như chưa đăng nhập để layout còn chuyển về /login thay vì treo mãi ở
    // màn "Đang kiểm tra đăng nhập…".
    return LOGGED_OUT;
  }
}

type MeContextValue = { me: Me | null; loading: boolean; refresh: () => Promise<Me> };

const MeContext = createContext<MeContextValue | null>(null);

// Chỉ fetch /api/auth/me MỘT LẦN cho toàn app, chia sẻ qua context — trước đây mỗi
// component (Header, layout, từng page, CheckInCard...) tự gọi useMe() riêng, mỗi lần
// chuyển trang lại bắn thêm cả loạt request giống nhau, cộng với độ trễ Postgres (Neon)
// khiến app cảm giác load lại từ đầu mỗi lần chuyển trang.
export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMe().then((data) => {
      if (active) {
        setMe(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchMe();
    setMe(data);
    return data;
  }, []);

  const value = useMemo(() => ({ me, loading, refresh }), [me, loading, refresh]);

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeContextValue {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe phải được gọi trong <MeProvider>");
  return ctx;
}
