// Catálogo de tipos de bloco — fonte única compartilhada por:
//   - BlockTypePicker: renderiza os cards de escolha e cria o bloco.
//   - BlockForm:       usa só o rótulo (header) e o set de conteúdo.
//
// Organizado em GRUPOS: conteúdo lecionado vs exercícios autocorrigidos —
// separar visualmente ajuda o admin a montar a parte com intenção.

import type { ReactNode } from "react";

export interface BlockTypeEntry {
  value: string;
  label: string;
  description: string;
  icon: ReactNode;
}

export const CONTENT_TYPES: BlockTypeEntry[] = [
  { value: "rich_text", label: "Texto", description: "Explicação detalhada ou texto.", icon: <IconText /> },
  { value: "reading_tts", label: "Leitura (áudio)", description: "Texto com botão de áudio.", icon: <IconReading /> },
  { value: "vocabulary", label: "Vocabulário", description: "Lista termo + tradução + áudio.", icon: <IconVocab /> },
  { value: "dialogue_tts", label: "Diálogo (áudio)", description: "Falas entre personagens.", icon: <IconDialogue /> },
  { value: "pronunciation", label: "Pronúncia", description: "Frases para ouvir e treinar.", icon: <IconPronunciation /> },
  { value: "examples", label: "Exemplos", description: "Frases com tradução e áudio.", icon: <IconExamples /> },
  { value: "speaking", label: "Speaking (falar)", description: "Aluno fala e o sistema corrige.", icon: <IconSpeaking /> },
  { value: "table", label: "Tabela", description: "Grade de linhas e colunas.", icon: <IconTable /> },
  { value: "image", label: "Imagem", description: "Imagem com legenda.", icon: <IconImage /> },
];

export const EXERCISE_TYPES_PICKER: BlockTypeEntry[] = [
  { value: "multiple_choice", label: "Múltipla escolha", description: "Pergunta + alternativas.", icon: <IconChoice /> },
  { value: "fill_blank", label: "Lacuna", description: "Aluno completa a frase.", icon: <IconBlank /> },
  { value: "translation", label: "Tradução", description: "Traduzir a frase.", icon: <IconTranslate /> },
  { value: "reorder_words", label: "Reordenar palavras", description: "Montar a frase na ordem certa.", icon: <IconReorder /> },
  { value: "error_correction", label: "Correção de erro", description: "Reescrever frase corrigida.", icon: <IconCorrection /> },
];

export const ALL_TYPES = [...CONTENT_TYPES, ...EXERCISE_TYPES_PICKER];

export const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ALL_TYPES.map((t) => [t.value, t.label]),
);

// Set para checagem rápida no conditional do título — todo bloco de
// conteúdo lecionado aceita título opcional no topo.
export const CONTENT_TYPE_VALUES = new Set(CONTENT_TYPES.map((t) => t.value));

// --- Ícones inline (SVG outline 24x24) — só usados no catálogo ---
function svgProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: "h-5 w-5",
  };
}

function IconText() {
  return (
    <svg {...svgProps()}>
      <path d="M4 6h16M4 12h12M4 18h8" />
    </svg>
  );
}

function IconReading() {
  return (
    <svg {...svgProps()}>
      <path d="M3 5a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3z" />
      <path d="M21 5a2 2 0 0 0-2-2h-4a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />
    </svg>
  );
}

function IconVocab() {
  return (
    <svg {...svgProps()}>
      <path d="M4 4h16v16H4z" />
      <path d="M4 9h16M9 4v16" />
    </svg>
  );
}

function IconDialogue() {
  return (
    <svg {...svgProps()}>
      <path d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2z" />
      <path d="M16 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v3l-4-3" />
    </svg>
  );
}

function IconPronunciation() {
  return (
    <svg {...svgProps()}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

function IconExamples() {
  return (
    <svg {...svgProps()}>
      <path d="M9 7h11M9 12h11M9 17h7" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function IconSpeaking() {
  return (
    <svg {...svgProps()}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function IconTable() {
  // Grade com cabeçalho destacado.
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v11" />
      <path d="M15 9v11" />
    </svg>
  );
}

function IconImage() {
  // Moldura com sol + montanha.
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5L5 20" />
    </svg>
  );
}

function IconChoice() {
  return (
    <svg {...svgProps()}>
      <circle cx="5" cy="7" r="2" />
      <circle cx="5" cy="17" r="2" />
      <path d="M11 7h10M11 17h10" />
      <path d="m3.5 7 1 1 2-2" />
    </svg>
  );
}

function IconBlank() {
  return (
    <svg {...svgProps()}>
      <path d="M4 6h6M14 6h6M4 12h16M4 18h6M14 18h6" />
    </svg>
  );
}

function IconTranslate() {
  return (
    <svg {...svgProps()}>
      <path d="M3 5h10" />
      <path d="M7 3v2c0 4-2 8-5 9" />
      <path d="M3 9c0 3 4 6 9 7" />
      <path d="m13 21 4-10 4 10" />
      <path d="M14.5 17h5" />
    </svg>
  );
}

function IconReorder() {
  return (
    <svg {...svgProps()}>
      <path d="M3 6h13l-3-3M21 18H8l3 3" />
    </svg>
  );
}

function IconCorrection() {
  return (
    <svg {...svgProps()}>
      <path d="M14 4 5 13l-1 5 5-1 9-9z" />
      <path d="m13 5 4 4" />
      <path d="m15 18 2 2 4-4" />
    </svg>
  );
}
