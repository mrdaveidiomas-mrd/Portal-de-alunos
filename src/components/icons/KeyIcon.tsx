export function KeyIcon({ className }: { className?: string }) {
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
      <circle cx="7.5" cy="15.5" r="4" />
      <path d="m10.5 12.5 9-9" />
      <path d="m17 6 3 3" />
      <path d="m14.5 8.5 3 3" />
    </svg>
  );
}
