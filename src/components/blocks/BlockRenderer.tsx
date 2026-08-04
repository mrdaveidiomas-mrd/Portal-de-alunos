import { DialogueBlock } from "@/components/blocks/DialogueBlock";
import { ErrorCorrectionExercise } from "@/components/blocks/ErrorCorrectionExercise";
import { ExamplesBlock } from "@/components/blocks/ExamplesBlock";
import { FillBlankExercise } from "@/components/blocks/FillBlankExercise";
import { ImageBlock } from "@/components/blocks/ImageBlock";
import { MultipleChoiceExercise } from "@/components/blocks/MultipleChoiceExercise";
import { PronunciationBlock } from "@/components/blocks/PronunciationBlock";
import { ReadingBlock } from "@/components/blocks/ReadingBlock";
import { ReorderWordsExercise } from "@/components/blocks/ReorderWordsExercise";
import { RichTextBlock } from "@/components/blocks/RichTextBlock";
import { SpeakingBlock } from "@/components/blocks/SpeakingBlock";
import { TableBlock } from "@/components/blocks/TableBlock";
import { TranslationExercise } from "@/components/blocks/TranslationExercise";
import { VocabularyBlock } from "@/components/blocks/VocabularyBlock";
import {
  dialogueData,
  errorCorrectionData,
  examplesData,
  fillBlankData,
  imageData,
  multipleChoiceData,
  pronunciationData,
  readingData,
  reorderWordsData,
  richTextData,
  speakingData,
  tableData,
  translationData,
  vocabularyData,
} from "@/lib/blocks/schemas";
import type { Block } from "@/types/content";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border-primary px-3 py-2 text-sm text-fg-tertiary">
      {children}
    </p>
  );
}

export interface TtsOverride {
  lang: "en" | "es";
  voice: string;
  rate: number;
}

// Renderiza um bloco a partir de seu `type` + `data`. Faz o parse com o schema
// específico de cada tipo (type-safe) e, se o conteúdo for inválido, mostra um
// aviso em vez de quebrar a página. `tts` (opcional) propaga as preferências do
// aluno para leitura e pronúncia — diálogos mantêm voz por personagem.
// `onSolved` é repassado para exercícios e usado pelo PartStepper para
// auto-avançar quando o aluno resolve.
export function BlockRenderer({
  block,
  tts,
  onSolved,
  onPartCompleted,
  previewMode = false,
}: {
  block: Block;
  tts?: TtsOverride;
  onSolved?: () => void;
  onPartCompleted?: (info: { stars: number | null; xpAwarded: number; lessonJustCompleted?: boolean }) => void;
  // Quando true, propaga para os exercícios — eles incluem na chamada da
  // Server Action para o backend não persistir nada (XP, progresso, SRS).
  previewMode?: boolean;
}) {
  switch (block.type) {
    case "rich_text": {
      const parsed = richTextData.safeParse(block.data);
      return parsed.success ? (
        <RichTextBlock data={parsed.data} />
      ) : (
        <Notice>Bloco de texto inválido.</Notice>
      );
    }
    case "vocabulary": {
      const parsed = vocabularyData.safeParse(block.data);
      return parsed.success ? (
        <VocabularyBlock data={parsed.data} tts={tts} />
      ) : (
        <Notice>Bloco de vocabulário inválido.</Notice>
      );
    }
    case "reading_tts": {
      const parsed = readingData.safeParse(block.data);
      return parsed.success ? (
        <ReadingBlock data={parsed.data} tts={tts} />
      ) : (
        <Notice>Bloco de leitura inválido.</Notice>
      );
    }
    case "dialogue_tts": {
      const parsed = dialogueData.safeParse(block.data);
      return parsed.success ? (
        <DialogueBlock data={parsed.data} />
      ) : (
        <Notice>Bloco de diálogo inválido.</Notice>
      );
    }
    case "pronunciation": {
      const parsed = pronunciationData.safeParse(block.data);
      return parsed.success ? (
        <PronunciationBlock data={parsed.data} tts={tts} />
      ) : (
        <Notice>Bloco de pronúncia inválido.</Notice>
      );
    }
    case "examples": {
      const parsed = examplesData.safeParse(block.data);
      return parsed.success ? (
        <ExamplesBlock data={parsed.data} tts={tts} />
      ) : (
        <Notice>Bloco de exemplos inválido.</Notice>
      );
    }
    case "table": {
      const parsed = tableData.safeParse(block.data);
      return parsed.success ? (
        <TableBlock data={parsed.data} />
      ) : (
        <Notice>Bloco de tabela inválido.</Notice>
      );
    }
    case "image": {
      const parsed = imageData.safeParse(block.data);
      return parsed.success ? (
        <ImageBlock data={parsed.data} />
      ) : (
        <Notice>Bloco de imagem inválido.</Notice>
      );
    }
    case "speaking": {
      const parsed = speakingData.safeParse(block.data);
      return parsed.success ? (
        <SpeakingBlock
          blockId={block.id}
          data={parsed.data}
          tts={tts}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Bloco de speaking inválido.</Notice>
      );
    }
    case "multiple_choice": {
      const parsed = multipleChoiceData.safeParse(block.data);
      return parsed.success ? (
        <MultipleChoiceExercise
          blockId={block.id}
          data={parsed.data}
          onSolved={onSolved}
          onPartCompleted={onPartCompleted}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Exercício inválido.</Notice>
      );
    }
    case "fill_blank": {
      const parsed = fillBlankData.safeParse(block.data);
      return parsed.success ? (
        <FillBlankExercise
          blockId={block.id}
          data={parsed.data}
          onSolved={onSolved}
          onPartCompleted={onPartCompleted}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Exercício inválido.</Notice>
      );
    }
    case "translation": {
      const parsed = translationData.safeParse(block.data);
      return parsed.success ? (
        <TranslationExercise
          blockId={block.id}
          data={parsed.data}
          onSolved={onSolved}
          onPartCompleted={onPartCompleted}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Exercício inválido.</Notice>
      );
    }
    case "reorder_words": {
      const parsed = reorderWordsData.safeParse(block.data);
      return parsed.success ? (
        <ReorderWordsExercise
          blockId={block.id}
          data={parsed.data}
          onSolved={onSolved}
          onPartCompleted={onPartCompleted}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Exercício inválido.</Notice>
      );
    }
    case "error_correction": {
      const parsed = errorCorrectionData.safeParse(block.data);
      return parsed.success ? (
        <ErrorCorrectionExercise
          blockId={block.id}
          data={parsed.data}
          onSolved={onSolved}
          onPartCompleted={onPartCompleted}
          previewMode={previewMode}
        />
      ) : (
        <Notice>Exercício inválido.</Notice>
      );
    }
    default:
      return <Notice>Tipo de bloco não suportado: {block.type}.</Notice>;
  }
}
