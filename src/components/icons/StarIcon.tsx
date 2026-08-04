export function StarIcon({
  filled = false,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5 14.94 8.46 21.5 9.42 16.75 14.05 17.87 20.58 12 17.5 6.13 20.58 7.25 14.05 2.5 9.42 9.06 8.46z" />
    </svg>
  );
}
