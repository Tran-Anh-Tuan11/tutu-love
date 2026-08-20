"use client";

import { useEffect } from "react";

export default function BackgroundStyle() {
  useEffect(() => {
    fetch("/api/relationship")
      .then((r) => r.json())
      .then((data) => {
        if (data.backgroundColor) {
          document.documentElement.style.setProperty("--bg", data.backgroundColor);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
