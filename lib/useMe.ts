"use client";

import { useCallback, useEffect, useState } from "react";

export type Me = {
  loggedIn: boolean;
  userId: "nam" | "nu" | null;
  name: string | null;
  enrollment: { nam: boolean; nu: boolean };
};

const LOGGED_OUT: Me = { loggedIn: false, userId: null, name: null, enrollment: { nam: false, nu: false } };

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

export function useMe() {
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

  return { me, loading, refresh };
}
