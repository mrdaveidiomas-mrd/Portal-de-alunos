import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { TtsOverride } from "@/components/blocks/BlockRenderer";
import type { PronunciationData } from "@/lib/blocks/schemas";

// Lista de frases de pronúncia — cada uma com seu próprio botão de áudio, para
// o aluno praticar no próprio ritmo.
export function PronunciationBlock({
  data,
  tts,
}: {
  data: PronunciationData;
  tts?: TtsOverride;
}) {
  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <ul className="flex flex-col divide-y divide-border-primary">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 py-2">
            <span className="text-fg-primary">{item}</span>
            <SpeakButton
              iconOnly
              body={{
                text: item,
                lang: tts?.lang ?? "en",
                ...(tts?.voice ? { voice: tts.voice } : {}),
                ...(tts?.rate ? { rate: tts.rate } : {}),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
