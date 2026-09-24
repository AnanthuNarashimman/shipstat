"use client";

import { THEME_KEY } from "@/lib/theme";

function apply(next: "light" | "dark") {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
}

// Both icons render; CSS shows the right one, so server and client markup always match.
export function ThemeToggle() {
  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) return apply(next);

    // Preferred: the new theme spreads in a circle from the button.
    if (document.startViewTransition) {
      const r = e.currentTarget.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.style.setProperty("--theme-x", `${x}px`);
      root.style.setProperty("--theme-y", `${y}px`);
      root.style.setProperty("--theme-r", `${radius}px`);
      document.startViewTransition(() => apply(next));
      return;
    }

    // Fallback: a short colour cross-fade.
    root.classList.add("theme-fading");
    apply(next);
    setTimeout(() => root.classList.remove("theme-fading"), 400);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
    >
      {/* moon: shown in light mode */}
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 dark:hidden">
        <path
          d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {/* sun: shown in dark mode */}
      <svg viewBox="0 0 20 20" aria-hidden className="hidden size-4 dark:block">
        <circle cx="10" cy="10" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
