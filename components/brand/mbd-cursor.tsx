"use client";

import { useEffect, useRef } from "react";

/**
 * MBD custom cursor — 11px dot + 38px ring, single requestAnimationFrame loop,
 * GPU translate3d. Hidden on touch / coarse pointer / reduced-motion devices.
 *
 * The ring lags behind the dot by ~10 frames, creating a soft trailing effect.
 * Hovering anchors, buttons, and `[data-cursor="hover"]` elements scales the
 * ring up and fills it with a soft glow.
 */

const HOVER_SELECTOR =
  "a, button, [role=button], input, select, textarea, label, summary, [data-cursor='hover']";

export function MbdCursor() {
  const dotRef  = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    // Bail on touch devices, reduced-motion, or SSR
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    document.documentElement.setAttribute("data-mbd-cursor", "on");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX  = mouseX;
    let ringY  = mouseY;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    }

    function tick() {
      // Lazy-follow ring: lerp by 18% per frame → soft trail
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function onEnterHover() { ringRef.current?.classList.add("is-hover"); }
    function onLeaveHover() { ringRef.current?.classList.remove("is-hover"); }

    function attachHoverListeners() {
      document.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
        el.addEventListener("mouseenter", onEnterHover);
        el.addEventListener("mouseleave", onLeaveHover);
      });
    }
    function detachHoverListeners() {
      document.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
        el.removeEventListener("mouseenter", onEnterHover);
        el.removeEventListener("mouseleave", onLeaveHover);
      });
    }

    window.addEventListener("mousemove", onMove);
    attachHoverListeners();

    // Re-attach when the DOM changes (e.g. React renders new buttons)
    const mo = new MutationObserver(() => {
      detachHoverListeners();
      attachHoverListeners();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      detachHoverListeners();
      mo.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.documentElement.removeAttribute("data-mbd-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="mbd-cursor-dot"  aria-hidden />
      <div ref={ringRef} className="mbd-cursor-ring" aria-hidden />
    </>
  );
}
