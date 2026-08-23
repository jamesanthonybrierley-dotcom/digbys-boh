"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nice-to-have; ignore registration failures
        // (e.g. running over plain http in local dev).
      });
    }
  }, []);
  return null;
}
