import { QuestionImage } from "@/components/blocks/QuestionImage";
import { RichTextBlock } from "@/components/blocks/RichTextBlock";
import type { PassageData } from "@/lib/blocks/schemas";

// Texto base: o enunciado comum a várias perguntas. Quem o coloca na mesma
// página das perguntas é o PartStepper (ver lib/blocks/pages.ts).
export function PassageBlock({ data }: { data: PassageData }) {
  return (
    <div className="flex flex-col gap-3">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <QuestionImage url={data.imageUrl} alt={data.imageAlt} />
      <RichTextBlock data={{ text: data.text }} />
    </div>
  );
}
