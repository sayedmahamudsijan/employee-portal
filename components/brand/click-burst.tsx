"use client";

import { useEffect, useRef } from "react";

/**
 * MBD click-burst — every click sprays a small canvas particle ring in the
 * current theme's accent colour. Cheap, GPU-friendly, no library.
 *
 * Gated by prefers-reduced-motion. The particle palette is pulled from the
 * CSS custom properties --mbd-particle-color / --mbd-particle-color-2, so
 * switching themes automatically retints the bursts.
 */

interface Particle {
  x:  number;
  y:  number;
  vx: number;
  vy: number;
  life: number;
  hue:  string;
  size: number;
}

export function MbdClickBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = window.innerWidth  * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width  = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    function readPalette(): [string, string] {
      const cs = getComputedStyle(document.documentElement);
      const a = cs.getPropertyValue("--mbd-particle-color").trim()   || "91, 47, 255";
      const b = cs.getPropertyValue("--mbd-particle-color-2").trim() || "255, 77, 28";
      return [a, b];
    }

    function spawn(x: number, y: number) {
      const [hueA, hueB] = readPalette();
      const N = 18;
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 2 + Math.random() * 3.5;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          hue: Math.random() < 0.6 ? hueA : hueB,
          size: 2 + Math.random() * 2.5,
        });
      }
    }

    function onClick(e: MouseEvent) {
      // Ignore clicks inside form fields — we want the burst on UI controls,
      // not while the user is mid-type.
      const target = e.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable]")) return;
      spawn(e.clientX, e.clientY);
    }
    window.addEventListener("click", onClick);

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const arr = particlesRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.vy += 0.06;            // gentle gravity
        p.life -= 0.022;
        if (p.life <= 0) { arr.splice(i, 1); continue; }
        ctx!.fillStyle = `rgba(${p.hue}, ${p.life.toFixed(2)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx!.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="mbd-burst" aria-hidden />;
}
