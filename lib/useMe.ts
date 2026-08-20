"use client";

import { useCallback, useEffect, useState } from "react";

export type Me = {
  loggedIn: boolean;
  userId: "nam" | "nu" | null;
  name: string | null;
  enrollment: { nam: boolean; nu: boolean };
};

async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/auth/me");
  return res.json();
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
