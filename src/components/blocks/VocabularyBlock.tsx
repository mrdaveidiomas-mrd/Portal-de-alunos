import { SpeakButton } from "@/components/blocks/SpeakButton";
import type { TtsOverride } from "@/components/blocks/BlockRenderer";
import type { VocabularyData } from "@/lib/blocks/schemas";

// Lista de vocabulário com botão de áudio por termo. O áudio sai da
// Edge Function `tts` (cache no Storage), mesma trilha de Reading/
// Pronunciation/Dialogue — ver SpeakButton + ADR 0003.
//
// `tts` carrega lang/voice/rate do preset do curso/aluno. Sem ele,
// caímos pra inglês por default (na prática o BlockRenderer sempre
// passa o do curso).
export function VocabularyBlock({
  data,
  tts,
}: {
  data: VocabularyData;
  tts?: TtsOverride;
}) {
  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <ul className="flex flex-col divide-y divide-border-primary">
        {data.items.map((item, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 py-2"
          >
            {/* Layout muda conforme há exemplo:
                  Sem exemplo  → termo (bold) em cima / tradução embaixo.
                  Com exemplo  → "termo: tradução" na 1ª linha / exemplo
                                  itálico embaixo.
                Em ambos os casos o botão de áudio fica sozinho à direita. */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {item.example ? (
                <>
                  <span className="text-fg-primary">
                    <span className="font-medium">{item.term}</span>:{" "}
                    {item.translation}
                  </span>
                  <span className="text-sm italic text-fg-tertiary">
                    {item.example}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium text-fg-primary">
                    {item.term}
                  </span>
                  <span className="text-sm text-fg-secondary">
                    {item.translation}
                  </span>
                </>
              )}
            </div>
            <SpeakButton
              iconOnly
              label={`Ouvir "${item.term}"`}
              body={{
                text: item.term,
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
