// A small ring that spins; takes the current text colour. With reduced motion it stays still (still visible).
export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`animate-spin motion-reduce:animate-none ${className}`}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.2" />
      <path d="M10 3a7 7 0 0 1 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
