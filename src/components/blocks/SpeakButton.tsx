"use client";

import { useRef, useState } from "react";

import { StopIcon } from "@/components/icons/StopIcon";
import { VolumeIcon } from "@/components/icons/VolumeIcon";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/browser";

type State = "idle" | "loading" | "playing" | "error";

// Botão "Ouvir" para blocos de leitura/diálogo/pronúncia. Invoca a Edge
// Function `tts` (gera/recupera o MP3 do cache no Storage) e toca o áudio.
// `body` é o payload da função: { text, lang, voice?, rate? } ou
// { lines, lang }. Para diálogos, voice/rate são ignorados pela função (cada
// personagem mantém voz própria). A URL é guardada para não reinvocar a função.
export function SpeakButton({
  body,
  label = "Ouvir",
  iconOnly = false,
}: {
  body: Record<string, unknown>;
  label?: string;
  iconOnly?: boolean;
}) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  async function handleClick() {
    if (state === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    let url = urlRef.current;
    if (!url) {
      setState("loading");
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("tts", { body });
      if (error || !data?.url) {
        setState("error");
        return;
      }
      url = data.url as string;
      urlRef.current = url;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("error");
    setState("playing");
    audio.play().catch(() => setState("error"));
  }

  const isPlaying = state === "playing";
  const Icon = isPlaying ? StopIcon : VolumeIcon;
  const text = isPlaying
    ? "Parar"
    : state === "error"
      ? "Tentar de novo"
      : label;

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        loading={state === "loading"}
        onClick={handleClick}
        aria-label={iconOnly ? text : undefined}
      >
        {state !== "loading" && <Icon className="h-4 w-4" />}
        {!iconOnly && <span>{text}</span>}
      </Button>
      {state === "error" && !iconOnly && (
        <span className="text-xs text-danger">
          Não foi possível gerar o áudio agora.
        </span>
      )}
    </div>
  );
}
