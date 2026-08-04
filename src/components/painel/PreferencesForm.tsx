"use client";

import { useRef, useState, useTransition } from "react";

import { SpeakButton } from "@/components/blocks/SpeakButton";
import { Card } from "@/components/ui/Card";
import { savePreferences } from "@/lib/preferences/actions";
import { toast } from "@/lib/toast/store";
import {
  DEFAULT_RATE,
  MAX_RATE,
  MIN_RATE,
  RATE_STEP,
  VOICES_BY_LANG,
  type VoiceOption,
} from "@/lib/tts/voices";
import { cn } from "@/lib/utils/cn";

interface Props {
  initialVoiceEn: string;
  initialVoiceEs: string;
  initialRate: number;
  // Idiomas das matrículas ativas do aluno. A seção de cada idioma só aparece
  // quando ele tem ao menos um curso naquele idioma.
  availableLanguages: ("en" | "es")[];
}

// Card "Áudio" com AUTOSAVE: qualquer mudança em voz (radio) ou velocidade
// (slider) salva sozinha. Voz salva imediatamente; slider tem debounce de
// 600ms para não disparar uma chamada por tick do drag.
//
// Indicador no canto superior direito mostra "Salvando…" durante a chamada
// e "Salvo" por ~1.6s após sucesso, depois some.
export function PreferencesForm({
  initialVoiceEn,
  initialVoiceEs,
  initialRate,
  availableLanguages,
}: Props) {
  const showEn = availableLanguages.includes("en");
  const showEs = availableLanguages.includes("es");
  const [voiceEn, setVoiceEn] = useState(initialVoiceEn);
  const [voiceEs, setVoiceEs] = useState(initialVoiceEs);
  const [rate, setRate] = useState(
    Number.isFinite(initialRate) ? initialRate : DEFAULT_RATE,
  );

  type Status = "idle" | "saving" | "saved";
  const [status, setStatus] = useState<Status>("idle");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function doSave(next: {
    voiceEn: string;
    voiceEs: string;
    rate: number;
  }) {
    setStatus("saving");
    startTransition(async () => {
      const res = await savePreferences(next);
      if (res.ok) {
        setStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setStatus("idle"), 1600);
      } else {
        setStatus("idle");
        toast.danger({
          title: "Não consegui salvar",
          description: res.error ?? "Tente novamente em instantes.",
        });
      }
    });
  }

  // Aplica um novo valor de voz e dispara save imediato (clique único, sem
  // debounce — feedback rápido).
  function applyVoice(lang: "en" | "es", id: string) {
    if (lang === "en") setVoiceEn(id);
    else setVoiceEs(id);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSave({
      voiceEn: lang === "en" ? id : voiceEn,
      voiceEs: lang === "es" ? id : voiceEs,
      rate,
    });
  }

  // Aplica novo valor de velocidade e agenda save com debounce — slider muda
  // rápido durante o drag.
  function applyRate(value: number) {
    setRate(value);
    setStatus("saving"); // feedback imediato de "vai salvar"
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave({ voiceEn, voiceEs, rate: value });
    }, 600);
  }

  const hasAnyVoiceSection = showEn || showEs;

  return (
    <Card padded className="flex flex-col gap-0 p-0">
      {/* Header com indicador de autosave no canto direito */}
      <header className="flex items-start justify-between gap-3 border-b border-border-primary px-5 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-fg-primary">Áudio</h2>
          <p className="text-sm text-fg-secondary">
            Preferências de áudio
          </p>
        </div>
        <SaveStatus status={status} />
      </header>

      {showEn && (
        <VoiceSection
          title="Voz para textos em inglês"
          voices={VOICES_BY_LANG.en}
          selected={voiceEn}
          onSelect={(id) => applyVoice("en", id)}
          rate={rate}
        />
      )}

      {showEs && (
        <VoiceSection
          title="Voz para textos em espanhol"
          voices={VOICES_BY_LANG.es}
          selected={voiceEs}
          onSelect={(id) => applyVoice("es", id)}
          rate={rate}
        />
      )}

      {!hasAnyVoiceSection && (
        <p className="border-b border-border-primary px-5 py-4 text-sm text-fg-secondary">
          Você ainda não está matriculado em nenhum curso. Quando estiver, as
          opções de voz aparecem aqui de acordo com o idioma do curso.
        </p>
      )}

      {/* Velocidade da fala */}
      <section className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-fg-primary">
            Velocidade da fala
          </h3>
          <span className="text-sm text-fg-secondary">
            {rate.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min={MIN_RATE}
          max={MAX_RATE}
          step={RATE_STEP}
          value={rate}
          onChange={(e) => applyRate(Number(e.target.value))}
          aria-label="Velocidade da fala"
          className="w-full accent-fg-primary"
        />
        <div className="flex justify-between text-xs text-fg-tertiary">
          <span>Mais devagar ({MIN_RATE.toFixed(2)}x)</span>
          <span>Padrão ({DEFAULT_RATE.toFixed(2)}x)</span>
          <span>Mais rápido ({MAX_RATE.toFixed(2)}x)</span>
        </div>
        <p className="text-xs text-fg-tertiary">
        </p>
      </section>
    </Card>
  );
}

// Pequeno chip no header indicando o estado do autosave. Quando idle não
// renderiza nada — evita poluição visual quando não há nada acontecendo.
function SaveStatus({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity",
        status === "saved"
          ? "bg-success-bg text-success"
          : "bg-bg-tertiary text-fg-secondary",
      )}
    >
      {status === "saving" ? (
        <>
          <Spinner />
          Salvando…
        </>
      ) : (
        <>
          <CheckIcon />
          Salvo
        </>
      )}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-30"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Subseção de voz dentro do card "Áudio". Cada voz é uma linha clicável:
//   - Linha de cima (acento, em destaque): "Americano (EUA)".
//   - Linha de baixo (gênero, sutil):      "Feminino".
// A voz selecionada ganha background e borda em destaque; sem rádio,
// porque o contexto deixa claro que é uma seleção exclusiva.
//
// Acessibilidade: cada linha tem role=radio + aria-checked + tabIndex,
// e responde a Space/Enter para selecionar. O ul tem role=radiogroup.
function VoiceSection({
  title,
  voices,
  selected,
  onSelect,
  rate,
}: {
  title: string;
  voices: VoiceOption[];
  selected: string;
  onSelect: (id: string) => void;
  rate: number;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border-primary px-5 py-4">
      <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
      <ul
        role="radiogroup"
        aria-label={title}
        className="flex flex-col gap-1.5"
      >
        {voices.map((v) => {
          const active = v.id === selected;
          return (
            <li key={v.id}>
              <div
                role="radio"
                tabIndex={0}
                aria-checked={active}
                aria-label={`${v.accent} ${v.gender === "female" ? "Feminino" : "Masculino"}`}
                onClick={() => onSelect(v.id)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    onSelect(v.id);
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-tertiary",
                  active
                    ? "border-fg-primary bg-bg-tertiary"
                    : "border-transparent hover:bg-bg-tertiary/60",
                )}
              >
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-fg-primary">
                    {v.accent}
                  </span>
                  <span className="text-xs text-fg-tertiary">
                    {v.gender === "female" ? "Feminino" : "Masculino"}
                  </span>
                </div>
                {/* SpeakButton mora num "stop propagation" para o clique no
                    botão de áudio não acionar a seleção da voz. */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <SpeakButton
                    iconOnly
                    body={{
                      text: v.example,
                      lang: v.language,
                      voice: v.id,
                      rate,
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
