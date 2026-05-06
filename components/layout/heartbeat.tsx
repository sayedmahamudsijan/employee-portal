"use client";

import { useEffect, useRef } from "react";

// Sends a heartbeat to the server every 30 s while the tab is active.
// Pauses when the page is hidden (battery/network friendly).
export function Heartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function ping() {
    // Fire-and-forget; ignore errors silently
    fetch("/api/users/heartbeat", { method: "POST" }).catch(() => {});
  }

  function start() {
    if (intervalRef.current) return;
    ping(); // immediate first ping on focus / mount
    intervalRef.current = setInterval(ping, 30_000);
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    // Start on mount
    start();

    // Pause when tab is hidden, resume when visible
    function onVisibility() {
      document.hidden ? stop() : start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // renders nothing
}
