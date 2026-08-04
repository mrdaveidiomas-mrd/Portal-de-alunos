// Faísca de 4 pontas — usada para representar XP (energia/recompensa).
export function SparkleIcon({ className }: { className?: string }) {
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
      <path d="M12 3 L13.5 9.5 L20 11 L13.5 12.5 L12 19 L10.5 12.5 L4 11 L10.5 9.5 Z" />
      <path d="M19 4 v3 M17.5 5.5 h3" />
      <path d="M5 17 v3 M3.5 18.5 h3" />
    </svg>
  );
}
