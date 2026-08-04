import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { TtsOverride } from "@/components/blocks/BlockRenderer";
import type { ReadingData } from "@/lib/blocks/schemas";

export function ReadingBlock({
  data,
  tts,
}: {
  data: ReadingData;
  tts?: TtsOverride;
}) {
  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <p className="whitespace-pre-wrap leading-relaxed text-fg-primary">
        {data.text}
      </p>
      <SpeakButton
        body={{
          text: data.text,
          lang: tts?.lang ?? "en",
          ...(tts?.voice ? { voice: tts.voice } : {}),
          ...(tts?.rate ? { rate: tts.rate } : {}),
        }}
      />
    </div>
  );
}
