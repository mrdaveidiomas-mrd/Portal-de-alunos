"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SpeakButton } from "@/components/blocks/SpeakButton";
import { MicIcon } from "@/components/icons/MicIcon";
import { StopIcon } from "@/components/icons/StopIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useSpeechRecognition } from "@/lib/speech/use-speech-recognition";
import { reviewItem, type ReviewItemResult } from "@/lib/srs/actions";
import type { SrsDueItem } from "@/lib/srs/queries";
import { cn } from "@/lib/utils/cn";

// Config de fala por idioma, resolvida no servidor a partir das
// preferências do aluno. `recognizerLang` é o BCP-47 do reconhecedor
// (honra sotaque preferido); `ttsVoice` é a voz do botão "Ouvir".
export interface SpeechConfig {
  en: { recognizerLang: string; ttsVoice: string };
  es: { recognizerLang: string; ttsVoice: string };
  rate: number;
}

interface Props {
  items: SrsDueItem[];
  speech: SpeechConfig;
}

// Sessão de revisão com auto-correção (ADR 0006 aplicado à revisão):
//   1. Mostra a pergunta (termo, frase ou pergunta original).
//   2. Aluno responde — digitando OU, no caso de speaking, FALANDO
//      (o erro original foi de pronúncia; a frase já está impressa).
//   3. Submit → Server Action grade → estado (perfect/close/incorrect).
//   4. Feedback inline: cor + resposta canônica + XP.
//   5. "Próximo" avança.
//
// XP é reduzido (revisão repete conteúdo). "Quase" e "errado" não
// pontuam — só "perfect".
export function ReviewSession({ items: initialItems, speech }: Props) {
  // Snapshot dos itens no MONTE da sessão. A lista de "due items" muda no
  // servidor a cada resposta (o item revisado sai do due), mas a sessão
  // precisa trabalhar sobre um conjunto FIXO — senão o `index` remapearia
  // para itens diferentes no meio do caminho. Defesa em profundidade: o
  // action já não revalida esta rota (ver srs/actions.ts), mas se algo
  // revalidar por outro caminho, este snapshot mantém a sessão estável.
  const [items] = useState(() => initialItems);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ReviewItemResult | null>(null);
  const [counts, setCounts] = useState({
    perfect: 0,
    close: 0,
    incorrect: 0,
  });
  const [pending, setPending] = useState(false);

  const total = items.length;
  const current = items[index];

  if (!current) {
    return (
      <Card padded className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Sessão concluída
        </h2>
        <p className="text-sm text-fg-secondary">
          Você revisou {total} {total === 1 ? "item" : "itens"} nesta sessão.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-fg-secondary">
          <li>Acertei: {counts.perfect}</li>
          <li>Quase: {counts.close}</li>
          <li>Errei: {counts.incorrect}</li>
        </ul>
        <div className="flex gap-2 pt-2">
          <Link href="/painel/revisar">
            <Button variant="secondary" size="sm">
              Voltar à lista
            </Button>
          </Link>
          <Link href="/painel">
            <Button size="sm">Ir ao painel</Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Renderização da "pergunta" depende do tipo:
  //  - exercise: a pergunta original
  //  - vocab:    "Como se diz X?" — o aluno escreve a tradução
  //  - speaking: a frase para o aluno PRONUNCIAR (revisão por voz)
  let prompt: string;
  let helper: string | null = null;
  let sourceLabel: string;
  switch (current.payload.type) {
    case "exercise":
      prompt = current.payload.question;
      sourceLabel = "Exercício";
      break;
    case "vocab":
      prompt = `Como se diz "${current.payload.term}"?`;
      helper = current.payload.example ?? null;
      sourceLabel = "Vocabulário";
      break;
    case "speaking":
      prompt = "Pronuncie a frase:";
      helper = `"${current.payload.phrase}"`;
      sourceLabel = "Speaking";
      break;
  }

  const isSpeaking = current.payload.type === "speaking";
  const submitted = result !== null;

  // Núcleo de submissão — `value` é a resposta digitada OU a transcrição
  // de voz. Rota única para todos os tipos (o servidor grada por tipo).
  function submit(value: string) {
    if (pending || submitted) return;
    if (value.trim().length === 0) return;
    setPending(true);
    void (async () => {
      const res = await reviewItem(current!.id, value);
      setPending(false);
      setResult(res);
      if (res.ok) {
        setCounts((c) => ({ ...c, [res.state]: c[res.state] + 1 }));
      }
    })();
  }

  function handleTextSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    submit(answer);
  }

  function nextItem() {
    setResult(null);
    setAnswer("");
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-fg-tertiary">
        <span>
          Item {index + 1} de {total}
        </span>
        <span>{sourceLabel}</span>
      </div>

      <Card padded className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-fg-tertiary">
            Pergunta
          </span>
          <p className="text-lg font-medium text-fg-primary">{prompt}</p>
          {helper && (
            <p className="text-sm italic text-fg-secondary">{helper}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border-primary pt-3">
          <span className="text-xs uppercase tracking-wide text-fg-tertiary">
            Sua resposta
          </span>

          {isSpeaking && current.payload.type === "speaking" ? (
            <SpeakingReviewAnswer
              key={current.id}
              phrase={current.payload.phrase}
              lang={current.payload.lang ?? "en"}
              speech={speech}
              disabled={pending || submitted}
              onValueChange={setAnswer}
            />
          ) : (
            <form onSubmit={handleTextSubmit}>
              <Input
                key={current.id}
                id="srs-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Digite aqui"
                autoFocus
                disabled={pending || submitted}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </form>
          )}
        </div>

        {/* Feedback após submit */}
        {result && (
          <div
            className={cn(
              "flex flex-col gap-1 rounded-md border px-3 py-2 text-sm",
              result.state === "perfect" &&
                "border-success/40 bg-success-bg/40 text-success",
              result.state === "close" &&
                "border-warning/40 bg-warning-bg/40 text-warning",
              result.state === "incorrect" &&
                "border-danger/40 bg-danger-bg/40 text-danger",
            )}
          >
            <span className="font-medium">
              {result.state === "perfect" && `Perfeito! +${result.xpAwarded} XP`}
              {result.state === "close" && "Quase lá"}
              {result.state === "incorrect" && "Não foi dessa vez"}
            </span>
            <span className="text-xs text-fg-secondary">
              Resposta:{" "}
              <span className="font-medium text-fg-primary">
                {result.expected}
              </span>
            </span>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        {submitted ? (
          <Button onClick={nextItem}>
            {index + 1 < total ? "Próximo" : "Concluir"}
          </Button>
        ) : (
          <Button
            onClick={() => submit(answer)}
            loading={pending}
            disabled={pending || answer.trim().length === 0}
          >
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}

// Área de resposta por VOZ para itens de speaking. Captura a transcrição
// (Web Speech API) e a espelha em `answer` do pai via onValueChange — o
// botão "Enviar" do rodapé continua sendo o gatilho único de submissão.
// Sem suporte a fala, cai num input de texto (mesma tolerância no grading).
function SpeakingReviewAnswer({
  phrase,
  lang,
  speech,
  disabled,
  onValueChange,
}: {
  phrase: string;
  lang: "en" | "es";
  speech: SpeechConfig;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  const cfg = lang === "es" ? speech.es : speech.en;
  const recognizer = useSpeechRecognition(cfg.recognizerLang);
  const [textFallback, setTextFallback] = useState("");
  const isListening = recognizer.status === "listening";

  // Espelha a transcrição de voz no valor do pai assim que muda.
  useEffect(() => {
    if (recognizer.transcript) onValueChange(recognizer.transcript);
  }, [recognizer.transcript, onValueChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* Ouvir a pronúncia correta antes de tentar. */}
      <SpeakButton
        label="Ouvir"
        body={{
          text: phrase,
          lang,
          voice: cfg.ttsVoice,
          rate: speech.rate,
        }}
      />

      {recognizer.supported ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {!isListening ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={recognizer.start}
                disabled={disabled}
              >
                <MicIcon className="h-4 w-4" /> Falar
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={recognizer.stop}>
                <StopIcon className="h-4 w-4" /> Parar
              </Button>
            )}
          </div>
          {recognizer.transcript && (
            <p className="text-sm italic text-fg-secondary">
              “{recognizer.transcript}”
            </p>
          )}
          {recognizer.error && (
            <p role="alert" className="text-sm text-danger">
              {recognizer.error}
            </p>
          )}
        </>
      ) : (
        // Fallback: navegador sem reconhecimento de fala → digitar.
        <div className="flex flex-col gap-1">
          <p className="text-xs text-fg-tertiary">
            Seu navegador não reconhece fala. Digite a frase:
          </p>
          <Input
            value={textFallback}
            onChange={(e) => {
              setTextFallback(e.target.value);
              onValueChange(e.target.value);
            }}
            placeholder="Digite a frase"
            aria-label="Digite a frase"
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
