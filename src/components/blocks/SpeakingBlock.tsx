"use client";

import { useState } from "react";

import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { TtsOverride } from "@/components/blocks/BlockRenderer";
import { MicIcon } from "@/components/icons/MicIcon";
import { StopIcon } from "@/components/icons/StopIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SpeakingData } from "@/lib/blocks/schemas";
import { useSpeechRecognition } from "@/lib/speech/use-speech-recognition";
import {
  submitSpeaking,
  type SpeakingResult,
} from "@/lib/speaking/actions";
import { toast } from "@/lib/toast/store";
import { languageCodeForVoice } from "@/lib/tts/voices";

export function SpeakingBlock({
  blockId,
  data,
  tts,
  previewMode = false,
}: {
  blockId: string;
  data: SpeakingData;
  tts?: TtsOverride;
  previewMode?: boolean;
}) {
  // BCP-47 do reconhecedor segue a voz preferida do aluno (ex.: en-IN).
  // Fallback: en-US.
  const lang = tts?.voice ? languageCodeForVoice(tts.voice) : "en-US";

  return (
    <div className="flex flex-col gap-3">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <ul className="flex flex-col divide-y divide-border-primary">
        {data.items.map((phrase, i) => (
          <li key={i} className="py-3">
            <SpeakingPhrase
              blockId={blockId}
              phraseIndex={i}
              phrase={phrase}
              lang={lang}
              tts={tts}
              previewMode={previewMode}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeakingPhrase({
  blockId,
  phraseIndex,
  phrase,
  lang,
  tts,
  previewMode = false,
}: {
  blockId: string;
  phraseIndex: number;
  phrase: string;
  lang: string;
  tts?: TtsOverride;
  previewMode?: boolean;
}) {
  const speech = useSpeechRecognition(lang);
  const [textFallback, setTextFallback] = useState("");
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [pending, setPending] = useState(false);

  const solved = result?.state === "perfect";
  const isListening = speech.status === "listening";

  async function handleSubmit(transcript: string, viaText: boolean) {
    if (transcript.trim().length === 0 || pending || solved) return;
    setPending(true);
    const res = await submitSpeaking({
      blockId,
      phraseIndex,
      transcript,
      viaText,
      previewMode,
    });
    setPending(false);
    setResult(res);
    notifySpeaking(res, phrase);
  }

  function tryAgain() {
    setResult(null);
    setTextFallback("");
    speech.reset();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-fg-primary">{phrase}</p>
        <SpeakButton
          iconOnly
          body={{
            text: phrase,
            lang: tts?.lang ?? "en",
            ...(tts?.voice ? { voice: tts.voice } : {}),
            ...(tts?.rate ? { rate: tts.rate } : {}),
          }}
        />
      </div>

      {/* Reconhecimento por voz, quando suportado */}
      {speech.supported ? (
        <div className="flex flex-wrap items-center gap-2">
          {!isListening ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={speech.start}
              disabled={pending || solved}
            >
              <MicIcon className="h-4 w-4" /> Falar
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={speech.stop}>
              <StopIcon className="h-4 w-4" /> Parar
            </Button>
          )}
          {speech.transcript && !pending && !solved && (
            <Button
              size="sm"
              onClick={() => handleSubmit(speech.transcript, false)}
              loading={pending}
            >
              Enviar
            </Button>
          )}
          {(result || !solved) && (result || speech.transcript) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={tryAgain}
              disabled={pending}
            >
              Tentar de novo
            </Button>
          )}
        </div>
      ) : (
        // Fallback: texto + Levenshtein (XP reduzido)
        <div className="flex flex-col gap-2">
          <p className="text-xs text-fg-tertiary">
            Seu navegador não reconhece fala. Digite a frase abaixo (XP
            reduzido — você não testou a pronúncia):
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              placeholder="Digite a frase"
              aria-label="Digite a frase"
              disabled={pending || solved}
              className="min-w-64 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(textFallback, true);
              }}
            />
            <Button
              size="sm"
              onClick={() => handleSubmit(textFallback, true)}
              loading={pending}
              disabled={textFallback.trim().length === 0 || solved}
            >
              Enviar
            </Button>
            {result && (
              <Button
                size="sm"
                variant="ghost"
                onClick={tryAgain}
                disabled={pending}
              >
                Tentar de novo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Transcrição capturada — mantida inline para o aluno comparar com a frase original */}
      {speech.supported && speech.transcript && (
        <p className="text-sm italic text-fg-secondary">
          “{speech.transcript}”
        </p>
      )}

      {/* Erros do reconhecedor — inline (não some) para orientar a permitir mic etc. */}
      {speech.error && (
        <p role="alert" className="text-sm text-danger">
          {speech.error}
        </p>
      )}
    </div>
  );
}

function notifySpeaking(result: SpeakingResult, target: string): void {
  if (!result.ok) {
    if (result.error) toast.danger({ title: result.error });
    return;
  }
  const xp = result.xpAwarded > 0 ? ` (+${result.xpAwarded} XP)` : "";
  switch (result.state) {
    case "perfect":
      toast.success({ title: `Perfeito!${xp}` });
      return;
    case "close":
      toast.warning({
        title: `Quase lá${xp}`,
        description: "Você ficou bem perto da frase original.",
      });
      return;
    case "incorrect":
      toast.danger({
        title: "Não foi dessa vez",
        description: `A frase era: ${target}`,
      });
      return;
  }
}
