import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { DialogueData } from "@/lib/blocks/schemas";

export function DialogueBlock({ data }: { data: DialogueData }) {
  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      {data.lines.map((line, i) => (
        <p key={i} className="text-fg-primary">
          <span className="font-medium text-fg-secondary">{line.speaker}: </span>
          {line.text}
        </p>
      ))}
      {/* Diálogo: cada personagem ganha uma voz diferente na função tts, no
          gênero escolhido pelo admin (ou inferido pelo nome, se não houver). */}
      <SpeakButton
        body={{
          lines: data.lines,
          speakerGenders: data.speakerGenders,
          lang: "en",
        }}
      />
    </div>
  );
}
