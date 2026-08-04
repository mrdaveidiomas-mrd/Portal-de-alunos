"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Wrapper de Web Speech API (SpeechRecognition) com tipagem mínima e
// API enxuta de hook. Cobre os 3 estados que a UI precisa:
//   - idle:        pronto para começar
//   - listening:   gravando
//   - error:       falha de permissão, rede, etc.
//
// Browsers sem suporte: hook devolve { supported: false } e a UI cai no
// fallback por texto.

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechStatus = "idle" | "listening" | "error";

export interface UseSpeechRecognitionResult {
  supported: boolean;
  status: SpeechStatus;
  transcript: string;
  error: string | null;
  // Inicia uma escuta nova; reseta transcript anterior.
  start: () => void;
  // Para de ouvir. Os resultados finais já capturados são preservados.
  stop: () => void;
  // Limpa transcript e erro, volta para idle.
  reset: () => void;
}

// O `lang` é BCP-47 (ex.: "en-US", "en-IN", "es-ES"). Quando muda, qualquer
// escuta em andamento é abortada e a próxima já usa o novo código.
export function useSpeechRecognition(
  lang: string,
): UseSpeechRecognitionResult {
  // useState com inicializador preguiçoso: roda 1x, mas só no cliente
  // (no SSR window é undefined e devolvemos null). Fica como estado para
  // não violar a regra "não ler ref durante render".
  const [ctor] = useState<SpeechRecognitionCtor | null>(() => getCtor());
  const supported = ctor !== null;

  const instanceRef = useRef<SpeechRecognitionInstance | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Garante limpeza ao desmontar (evita reconhecedor "fantasma" em background).
  useEffect(() => {
    return () => {
      instanceRef.current?.abort();
      instanceRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!ctor) return;
    // Sempre cria nova instância — algumas implementações falham em reuse.
    instanceRef.current?.abort();
    const rec = new ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      // Concatena todos os resultados finais retornados.
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r && r.isFinal) text += r[0].transcript;
      }
      setTranscript(text.trim());
    };
    rec.onerror = (e) => {
      setError(humanizeError(e.error));
      setStatus("error");
    };
    rec.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };
    setTranscript("");
    setError(null);
    setStatus("listening");
    try {
      rec.start();
      instanceRef.current = rec;
    } catch {
      setError("Não foi possível iniciar o microfone.");
      setStatus("error");
    }
  }, [ctor, lang]);

  const stop = useCallback(() => {
    instanceRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    instanceRef.current?.abort();
    setTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  return { supported, status, transcript, error, start, stop, reset };
}

function humanizeError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permita o microfone para usar o speaking.";
    case "no-speech":
      return "Não captei nenhuma fala. Tente de novo.";
    case "audio-capture":
      return "Não encontrei microfone disponível.";
    case "network":
      return "Falha de rede no reconhecedor.";
    default:
      return "Erro no reconhecedor de voz.";
  }
}
