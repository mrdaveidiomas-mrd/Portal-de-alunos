// Ilustração "caixa vazia" — para estados vazios de listas (matrículas,
// conquistas, marcações).
export function InboxIllustration({ className }: { className?: string }) {
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
      {/* Bandeja externa */}
      <path d="M16 50l8-24c.6-2 2.4-3 4.5-3h39c2.1 0 3.9 1 4.5 3l8 24v18a4 4 0 01-4 4H20a4 4 0 01-4-4V50z" />
      <path d="M16 50h20l4 8h16l4-8h20" />
      {/* Sombra interna sutil */}
      <path d="M28 30h40" opacity="0.4" />
      <path d="M26 36h44" opacity="0.4" />
    </svg>
  );
}
