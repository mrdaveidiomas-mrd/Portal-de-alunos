import { notFound } from "next/navigation";

import { BlockForm, type BlockInitial } from "@/components/admin/BlockForm";
import { BlockRowMenu } from "@/components/admin/BlockRowMenu";
import { BlockTypePicker } from "@/components/admin/BlockTypePicker";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin/guard";
import {
  dialogueData,
  fillBlankData,
  fillBlankSolution,
  isExerciseType,
  multipleChoiceData,
  multipleChoiceSolution,
  errorCorrectionData,
  errorCorrectionSolution,
  examplesData,
  imageData,
  pronunciationData,
  readingData,
  reorderWordsData,
  richTextData,
  speakingData,
  tableData,
  translationData,
  translationSolution,
  vocabularyData,
} from "@/lib/blocks/schemas";

function toInitial(
  type: string,
  data: unknown,
  solution: unknown,
): BlockInitial {
  switch (type) {
    case "rich_text": {
      const p = richTextData.safeParse(data);
      return {
        title: p.success ? (p.data.title ?? "") : "",
        text: p.success ? p.data.text : "",
      };
    }
    case "reading_tts": {
      const p = readingData.safeParse(data);
      return p.success ? { title: p.data.title ?? "", text: p.data.text } : {};
    }
    case "pronunciation": {
      const p = pronunciationData.safeParse(data);
      return p.success
        ? { title: p.data.title ?? "", items: p.data.items.join("\n") }
        : {};
    }
    case "speaking": {
      const p = speakingData.safeParse(data);
      return p.success
        ? { title: p.data.title ?? "", items: p.data.items.join("\n") }
        : {};
    }
    case "vocabulary": {
      const p = vocabularyData.safeParse(data);
      return p.success
        ? {
            title: p.data.title ?? "",
            items: p.data.items
              .map((it) => {
                const head = `${it.term}: ${it.translation}`;
                return it.example ? `${head} | ${it.example}` : head;
              })
              .join("\n"),
          }
        : {};
    }
    case "table": {
      const p = tableData.safeParse(data);
      return p.success
        ? {
            title: p.data.title ?? "",
            // O TableGridEditor lê/escreve o grid como JSON.
            table: JSON.stringify({ header: p.data.header, rows: p.data.rows }),
          }
        : {};
    }
    case "image": {
      const p = imageData.safeParse(data);
      return p.success
        ? {
            title: p.data.title ?? "",
            url: p.data.url,
            alt: p.data.alt,
            caption: p.data.caption ?? "",
            width: p.data.width ?? "full",
          }
        : {};
    }
    case "examples": {
      const p = examplesData.safeParse(data);
      return p.success
        ? {
            title: p.data.title ?? "",
            items: p.data.items
              .map((it) => [it.sentence, it.translation].filter(Boolean).join(" | "))
              .join("\n"),
          }
        : {};
    }
    case "dialogue_tts": {
      const p = dialogueData.safeParse(data);
      return p.success
        ? {
            title: p.data.title ?? "",
            lines: p.data.lines.map((l) => `${l.speaker}: ${l.text}`).join("\n"),
          }
        : {};
    }
    case "multiple_choice": {
      const p = multipleChoiceData.safeParse(data);
      const s = multipleChoiceSolution.safeParse(solution);
      return {
        question: p.success ? p.data.question : "",
        options: p.success ? p.data.options.join("\n") : "",
        answerIndex: s.success ? String(s.data.answerIndex) : "0",
      };
    }
    case "fill_blank": {
      const p = fillBlankData.safeParse(data);
      const s = fillBlankSolution.safeParse(solution);
      return {
        prompt: p.success ? p.data.prompt : "",
        answer: s.success ? s.data.answer : "",
        alternatives: s.success ? (s.data.alternatives ?? []).join(", ") : "",
      };
    }
    case "translation": {
      const p = translationData.safeParse(data);
      const s = translationSolution.safeParse(solution);
      return {
        instruction: p.success ? (p.data.instruction ?? "") : "",
        source: p.success ? p.data.source : "",
        answer: s.success ? s.data.answer : "",
        alternatives: s.success ? (s.data.alternatives ?? []).join(", ") : "",
      };
    }
    case "error_correction": {
      const p = errorCorrectionData.safeParse(data);
      const s = errorCorrectionSolution.safeParse(solution);
      return {
        instruction: p.success ? (p.data.instruction ?? "") : "",
        sentence: p.success ? p.data.sentence : "",
        answer: s.success ? s.data.answer : "",
        alternatives: s.success ? (s.data.alternatives ?? []).join(", ") : "",
      };
    }
    case "reorder_words": {
      const p = reorderWordsData.safeParse(data);
      return {
        instruction: p.success ? (p.data.instruction ?? "") : "",
        tokens: p.success ? p.data.tokens.join(" ") : "",
      };
    }
    default:
      return {};
  }
}

export default async function AdminPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: part } = await supabase
    .from("parts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!part) notFound();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("part_id", id)
    .order("position");

  const exerciseIds = (blocks ?? [])
    .filter((b) => isExerciseType(b.type))
    .map((b) => b.id);

  const solutions = new Map<string, unknown>();
  if (exerciseIds.length > 0) {
    const { data: sols } = await supabase
      .from("exercise_solutions")
      .select("block_id, solution")
      .in("block_id", exerciseIds);
    for (const s of sols ?? []) solutions.set(s.block_id, s.solution);
  }

  return (
    <div className="flex flex-col gap-8">
      <BackLink href={`/admin/licoes/${part.lesson_id}`} label="Lição" />

      <h1 className="text-2xl font-semibold text-fg-primary">{part.title}</h1>

      {/* Blocos: lista simples (sem drag-and-drop). Reordenar usa o menu
          de 3 pontos (Subir/Descer) — drag aqui atrapalhava a digitação
          nos formulários, e na prática o admin reordena blocos com pouca
          frequência. Módulos/lições/partes seguem com DnD. */}
      <section className="flex flex-col gap-4">
        {(blocks ?? []).map((block) => (
          <Card key={block.id} className="flex flex-col p-7">
            <BlockForm
              partId={part.id}
              courseId={part.course_id}
              blockId={block.id}
              type={block.type}
              initial={toInitial(
                block.type,
                block.data,
                solutions.get(block.id),
              )}
              headerSlot={
                <BlockRowMenu blockId={block.id} partId={part.id} />
              }
            />
          </Card>
        ))}
      </section>

      {/* Escolher o tipo CRIA o bloco na hora (em branco) — ele aparece na
          lista acima já em edição, e este card segue limpo para o próximo. */}
      <Card className="flex flex-col gap-4 p-7">
        <h2 className="text-base font-semibold text-fg-primary">Novo bloco</h2>
        <BlockTypePicker partId={part.id} />
      </Card>
    </div>
  );
}
