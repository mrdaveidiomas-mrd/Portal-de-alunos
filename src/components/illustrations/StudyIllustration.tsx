// Ilustração leve "estudo / livro aberto" — monocromática, currentColor.
// Usada em empty states de cursos/lições.
export function StudyIllustration({ className }: { className?: string }) {
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
      {/* Livro aberto */}
      <path d="M14 30v40l34-6 34 6V30L48 36 14 30z" />
      <path d="M48 36v40" />
      <path d="M22 38l20 4M22 48l20 4M74 38l-20 4M74 48l-20 4" opacity="0.6" />
      {/* Lápis no canto */}
      <path d="M62 16l10 10-22 22-10-10 22-22z" opacity="0.5" />
      <path d="M40 38l-4 12 12-4" opacity="0.5" />
    </svg>
  );
}
