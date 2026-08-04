// Linha ascendente com seta — representa "recorde" / "maior streak".
export function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 17 L9 11 L13 15 L21 7" />
      <path d="M15 7 H21 V13" />
    </svg>
  );
}
