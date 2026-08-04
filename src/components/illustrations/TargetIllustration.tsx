// Ilustração "alvo / objetivo" — para estados vazios de revisão (SRS) ou
// conquistas a alcançar.
export function TargetIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="48" cy="48" r="30" />
      <circle cx="48" cy="48" r="20" opacity="0.6" />
      <circle cx="48" cy="48" r="10" opacity="0.4" />
      <circle cx="48" cy="48" r="3" fill="currentColor" />
      {/* Flecha do canto superior direito */}
      <path d="M78 18l-22 22" opacity="0.5" />
      <path d="M70 18h8v8" opacity="0.5" />
    </svg>
  );
}
