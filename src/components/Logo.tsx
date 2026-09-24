import Link from "next/link";

// Three rising bars with the last one in accent.
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill="var(--ink)" />
      <rect x="6" y="12.5" width="3" height="5" rx="1" fill="var(--bg)" opacity="0.55" />
      <rect x="10.5" y="9.5" width="3" height="8" rx="1" fill="var(--bg)" opacity="0.8" />
      <rect x="15" y="6" width="3" height="11.5" rx="1" fill="var(--accent-soft)" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 text-ink">
      <LogoMark className={size === "sm" ? "size-5" : "size-6"} />
      <span className={`font-semibold tracking-tight ${size === "sm" ? "text-[15px]" : "text-lg"}`}>shipstat</span>
    </Link>
  );
}
