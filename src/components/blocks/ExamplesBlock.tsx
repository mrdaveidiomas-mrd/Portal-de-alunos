import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { TtsOverride } from "@/components/blocks/BlockRenderer";
import type { ExamplesData } from "@/lib/blocks/schemas";

// Bloco "Exemplos": lista de frases-exemplo com tradução opcional e
// botão de áudio por item. Mesmo pipeline TTS de Reading/Pronunciation/
// Vocabulary (Edge Function tts com cache no Storage — ADR 0003).
//
// Layout: frase no topo com o botão de áudio à direita; tradução em
// itálico secundária logo abaixo (quando preenchida).
export function ExamplesBlock({
  data,
  tts,
}: {
  data: ExamplesData;
  tts?: TtsOverride;
}) {
  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <ul className="flex flex-col divide-y divide-border-primary">
        {data.items.map((item, i) => (
          <li key={i} className="flex flex-col gap-0.5 py-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-fg-primary">{item.sentence}</span>
              <SpeakButton
                iconOnly
                label={`Ouvir frase ${i + 1}`}
                body={{
                  text: item.sentence,
                  lang: tts?.lang ?? "en",
                  ...(tts?.voice ? { voice: tts.voice } : {}),
                  ...(tts?.rate ? { rate: tts.rate } : {}),
                }}
              />
            </div>
            {item.translation && (
              <span className="text-sm italic text-fg-secondary">
                {item.translation}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
