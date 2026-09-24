"use client";

import { useEffect, useRef } from "react";

const CELL = 12;
const GAP = 3;
const PITCH = CELL + GAP;
const RISE_MS = 1400;
// The wave band: 42% of the hero, kept between 170px and 400px tall.
const BAND_MIN = 170;
const BAND_MAX = 400;
const BAND_SHARE = 0.42;

// Stable pseudo-random value per cell, so pixels only change when their tick changes, not every frame.
function hash(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

type Palette = { soft: string[]; strong: string[] };

function readPalette(el: HTMLElement): Palette {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    soft: [v("--wave-red"), v("--wave-orange"), v("--wave-yellow")],
    strong: [v("--wave-red-strong"), v("--wave-orange-strong"), v("--wave-yellow-strong")],
  };
}

/**
 * Square-pixel waves rising from the bottom of the hero: red at the base, orange through the body,
 * yellow at the crest, inside a band along the bottom edge.
 */
export function PixelWaves({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let palette = readPalette(canvas);
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const started = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const cell = (i: number, j: number) => ctx.fillRect(i * PITCH, height - (j + 1) * PITCH + GAP, CELL, CELL);

    const draw = (now: number) => {
      const t = reduced ? 0 : (now - started) / 1000;
      const rise = reduced ? 1 : Math.min(1, (now - started) / RISE_MS);
      const eased = 1 - (1 - rise) ** 3;
      const cols = Math.ceil(width / PITCH) + 1;
      const waveRows = Math.floor(Math.min(BAND_MAX, Math.max(BAND_MIN, height * BAND_SHARE)) / PITCH);
      const tick = Math.floor(t * 2.5); // bright wave pixels reshuffle a couple of times a second

      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < cols; i++) {
        const wave =
          0.46 +
          0.2 * Math.sin(i * 0.11 + t * 0.7) +
          0.12 * Math.sin(i * 0.043 - t * 0.45 + 1.3) +
          0.06 * Math.sin(i * 0.31 + t * 1.6);
        const h = Math.max(0, wave * waveRows * eased);
        const full = Math.floor(h);

        // Waves
        for (let j = 0; j <= full; j++) {
          if (j === full && hash(i, j, tick) > h - full) continue; // dithered crest
          const depth = j / Math.max(1, h); // 0 at the bottom, 1 at the crest
          const band = depth < 0.34 ? 0 : depth < 0.72 ? 1 : 2;
          const bright = hash(i, j, tick + 7) < 0.06 + depth * 0.1;
          ctx.fillStyle = bright ? palette.strong[band] : palette.soft[band];
          cell(i, j);
        }

      }
      if (!reduced && visible) frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    ro.observe(canvas);

    // Pause while scrolled away.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    // Pick up theme switches.
    const mo = new MutationObserver(() => {
      palette = readPalette(canvas);
      if (reduced) draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none block ${className}`} />;
}
