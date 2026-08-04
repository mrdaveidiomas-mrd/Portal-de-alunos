export function CopyIcon({ className }: { className?: string }) {
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
      {/* Folha de cima: retângulo arredondado deslocado para cima/direita */}
      <rect x="9" y="9" width="13" height="13" rx="2" />
      {/* Folha de baixo: aparece atrás, deslocada para baixo/esquerda */}
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
