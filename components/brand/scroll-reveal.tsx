"use client";

import { useEffect } from "react";

/**
 * Adds an IntersectionObserver that toggles `.is-visible` on every
 * element with `.mbd-reveal` when it scrolls into view. Mount this once
 * (in Providers) and forget about it.
 *
 * Why a global observer rather than a per-component wrapper:
 *   - Works on server-rendered HTML without React rehydration
 *   - Cheaper than mounting N MutationObservers
 *   - Lets any component opt in by adding the class
 *
 * No-op on prefers-reduced-motion (CSS already collapses the animation).
 */
export function MbdScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Just unhide everything so content is never stuck at opacity 0.
      document.querySelectorAll(".mbd-reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    function observeAll() {
      document.querySelectorAll(".mbd-reveal:not(.is-visible)").forEach((el) => io.observe(el));
    }

    observeAll();

    // Re-observe newly rendered elements (React renders the rest of the app
    // after the providers mount).
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  return null;
}
