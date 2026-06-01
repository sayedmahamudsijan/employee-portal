"use client";

import { useEffect, useState } from "react";

/**
 * Top-right MBD mood-theme switcher.
 *
 * Cycles between dark / spooky / magic / euphoric by toggling
 * `<html data-theme="...">`. Persisted to localStorage("mbd-theme").
 *
 * Each theme rewires --background, --primary, etc. via [data-theme] selectors
 * in globals.css. No re-render of children is needed — the cascade does
 * the work for us.
 */

type ThemeKey = "dark" | "spooky" | "magic" | "euphoric";

const THEMES: { key: ThemeKey; label: string; glyph: string }[] = [
  { key: "dark",     label: "Dark",     glyph: "◐" },
  { key: "spooky",   label: "Spooky",   glyph: "❍" },
  { key: "magic",    label: "Magic",    glyph: "✦" },
  { key: "euphoric", label: "Euphoric", glyph: "☀" },
];

export function MbdThemeSwitcher() {
  const [active, setActive] = useState<ThemeKey>("dark");

  // On mount: read persisted choice and apply
  useEffect(() => {
    try {
      const stored = (typeof window !== "undefined" && window.localStorage.getItem("mbd-theme")) as ThemeKey | null;
      const initial: ThemeKey = stored && THEMES.some((t) => t.key === stored) ? stored : "dark";
      setActive(initial);
      document.documentElement.setAttribute("data-theme", initial);
    } catch {
      /* localStorage may be blocked — fall back to dark */
    }
  }, []);

  function selectTheme(next: ThemeKey) {
    setActive(next);
    document.documentElement.setAttribute("data-theme", next);
    try { window.localStorage.setItem("mbd-theme", next); } catch {}
  }

  return (
    <div className="mbd-theme-switcher" role="radiogroup" aria-label="MBD mood theme">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          role="radio"
          aria-checked={active === t.key}
          aria-pressed={active === t.key}
          aria-label={`${t.label} theme`}
          onClick={() => selectTheme(t.key)}
          title={t.label}
        >
          <span aria-hidden className="text-[0.85rem] leading-none mr-1.5">{t.glyph}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
