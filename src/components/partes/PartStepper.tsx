"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { BlockRenderer, type TtsOverride } from "@/components/blocks/BlockRenderer";
import {
  LessonCompletionDialog,
  type LessonCompletionStudent,
} from "@/components/partes/LessonCompletionDialog";
import { PartCompletionDialog } from "@/components/partes/PartCompletionDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { groupBlocksIntoPages } from "@/lib/blocks/pages";
import { isExerciseType } from "@/lib/blocks/schemas";
import { markPartCompleted } from "@/lib/parts/actions";
import { toast } from "@/lib/toast/store";
import type { Block } from "@/types/content";

// Stepper que mostra UMA página por vez dentro de uma parte (estilo Duolingo).
// Em geral a página é um bloco; um texto base aparece junto das suas perguntas.
//
// Regras de avanço:
//   - Conteúdo (rich_text, vocabulary, reading_tts, dialogue_tts,
//     pronunciation, speaking): botão "Próximo" sempre disponível.
//   - Exercícios (mc, fill_blank, translation, reorder, error_correction):
//     "Próximo" aparece só DEPOIS que o aluno acerta (callback onSolved
//     vindo do renderer). Em ReorderWords/MultipleChoice só "perfect"
//     conta; nos demais "close" também libera. Com várias perguntas na
//     página, "Próximo" espera todas. O que o aluno já acertou em outra
//     visita (`solvedBlockIds`) não precisa ser respondido de novo; quem errou
//     e recarregou a página responde só aquela pergunta.
//
// O último bloco é seguido pela "tela final": se a parte JÁ está completa
// (todos os exercícios foram acertados, ou marcada manualmente), mostra
// um parabéns; se não, e a parte NÃO tem exercícios, oferece o botão
// "Próximo" — clique marca a parte como concluída E dispara a celebração
// (com botão "Próxima parte" / "Voltar ao curso" para o aluno seguir).
export function PartStepper({
  partId,
  blocks,
  solvedBlockIds = [],
  tts,
  initiallyCompleted,
  courseHref,
  nextPartHref,
  previewMode = false,
  lessonTitle,
  student,
  currentStreak,
}: {
  partId: string;
  blocks: Block[];
  solvedBlockIds?: string[];
  tts?: TtsOverride;
  initiallyCompleted: boolean;
  courseHref?: string;
  // Próxima parte da mesma lição (opcional). Quando presente, o diálogo
  // de celebração mostra um botão "Próxima" no lugar de "Continuar aqui".
  nextPartHref?: string;
  // Em pré-visualização do admin, propaga para o BlockRenderer (e para
  // markPartCompleted) — o servidor faz dry-run.
  previewMode?: boolean;
  // Metadados usados pelo LessonCompletionDialog (renderizado quando a
  // parte concluída era a ÚLTIMA pendente da lição).
  lessonTitle?: string;
  student?: LessonCompletionStudent;
  currentStreak?: number;
}) {
  const pages = groupBlocksIntoPages(blocks);
  const total = pages.length;
  const [index, setIndex] = useState(0);
  // Tracking dos blocos que viraram "Próximo disponível" — para que voltar
  // não force resolver de novo (o servidor já guarda o melhor estado, então
  // re-renderizar o exercício não derruba o solved).
  const [unlockedAhead, setUnlockedAhead] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [pending, startTransition] = useTransition();
  // Estado da tela de celebração: abre quando a parte transiciona para
  // completed nesta sessão (uma vez por sessão).
  const [celebration, setCelebration] = useState<{
    open: boolean;
    stars: number | null;
    xpAwarded: number;
    seed: number;
    // Quando true, abrimos o LessonCompletionDialog (polido, com
    // compartilhamento) em vez do PartCompletionDialog padrão.
    lessonJustCompleted: boolean;
  }>({
    open: false,
    stars: null,
    xpAwarded: 0,
    seed: 1,
    lessonJustCompleted: false,
  });

  // Gera um seed novo para o confetti SEMPRE em handler — fora de render,
  // conforme regra de pureza do React 19. O dialog usa o mesmo seed por
  // toda a animação enquanto estiver aberto.
  function newSeed(): number {
    return Math.floor(Math.random() * 1e9) + 1;
  }

  const hasExerciseInPart = blocks.some((b) => isExerciseType(b.type));
  const page = pages[index];
  const isLast = index === total - 1;
  const exercises = (page?.items ?? []).filter((b) => isExerciseType(b.type));
  // Vem da prop, não de state: "Tentar de novo" zera as tentativas e revalida a
  // página, e os exercícios precisam voltar a pedir resposta.
  const solved = new Set(solvedBlockIds);
  // Para conteúdo, sempre pode seguir. Para exercício, precisa estar solved.
  const pendingExercises = exercises.filter(
    (b) => !solved.has(b.id) && !unlockedAhead.has(b.id),
  );
  const canAdvance = pendingExercises.length === 0;

  function markSolved(blockId: string) {
    setUnlockedAhead((prev) => {
      if (prev.has(blockId)) return prev;
      const next = new Set(prev);
      next.add(blockId);
      return next;
    });
  }

  function handlePartCompleted(info: {
    stars: number | null;
    xpAwarded: number;
    lessonJustCompleted?: boolean;
  }) {
    setCompleted(true);
    setCelebration({
      open: true,
      stars: info.stars,
      xpAwarded: info.xpAwarded,
      seed: newSeed(),
      lessonJustCompleted: info.lessonJustCompleted ?? false,
    });
  }

  function next() {
    if (!canAdvance) return;
    if (index < total - 1) {
      setIndex(index + 1);
    }
  }

  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  function handleMarkCompleted() {
    if (completed || pending) return;
    startTransition(async () => {
      const res = await markPartCompleted(partId, previewMode);
      if (res.ok) {
        setCompleted(true);
        if (res.justCompleted) {
          // Parte sem exercícios não rende estrelas (stars = null no dialog).
          setCelebration({
            open: true,
            stars: null,
            xpAwarded: res.xpAwarded ?? 0,
            seed: newSeed(),
            lessonJustCompleted: res.lessonJustCompleted ?? false,
          });
        } else {
          toast.success({ title: "Parte concluída!" });
        }
      } else if (res.error) {
        toast.danger({ title: res.error });
      }
    });
  }

  if (total === 0) {
    return (
      <Card padded>
        <p className="text-sm text-fg-secondary">
          Esta parte ainda não tem conteúdo.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho do stepper: posição + barra */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-fg-tertiary">
          <span>
            {index + 1} de {total}
          </span>
          {!canAdvance && (
            <span>
              {pendingExercises.length > 1
                ? "Responda todas as perguntas para continuar"
                : "Responda para continuar"}
            </span>
          )}
        </div>
        <ProgressBar
          value={index + 1}
          max={total}
          ariaLabel="Progresso na parte"
        />
      </div>

      {/* Página atual */}
      <Card
        key={page?.passage?.id ?? page?.items[0]?.id}
        padded
        className="animate-fade-slide-in flex flex-col gap-6"
      >
        {page?.passage && (
          <BlockRenderer
            block={page.passage}
            tts={tts}
            previewMode={previewMode}
          />
        )}
        {page?.items.map((block, i) =>
          page.passage ? (
            <div
              key={block.id}
              className="flex flex-col gap-3 border-t border-border-primary pt-6"
            >
              <span className="text-xs font-medium uppercase text-fg-tertiary">
                Pergunta {i + 1} de {page.items.length}
              </span>
              <BlockRenderer
                block={block}
                tts={tts}
                previewMode={previewMode}
                alreadySolved={solved.has(block.id)}
                onSolved={() => markSolved(block.id)}
                onPartCompleted={handlePartCompleted}
              />
            </div>
          ) : (
            <BlockRenderer
              key={block.id}
              block={block}
              tts={tts}
              previewMode={previewMode}
              alreadySolved={solved.has(block.id)}
              onSolved={() => markSolved(block.id)}
              onPartCompleted={handlePartCompleted}
            />
          ),
        )}
      </Card>

      {/* Controles — separados do conteúdo por uma borda sutil para
          deixar claro que são metadata da navegação, não parte do bloco. */}
      <div className="flex items-center justify-between gap-2 border-t border-border-primary pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={prev}
          disabled={index === 0}
        >
          Anterior
        </Button>

        {!isLast ? (
          <Button
            type="button"
            size="sm"
            onClick={next}
            disabled={!canAdvance}
          >
            Próximo
          </Button>
        ) : (
          <FinalAction
            hasExerciseInPart={hasExerciseInPart}
            completed={completed}
            pending={pending}
            canAdvance={canAdvance}
            onMark={handleMarkCompleted}
            nextPartHref={nextPartHref}
            courseHref={courseHref}
          />
        )}
      </div>

      {/* Diálogo de celebração: rota para o polido de LIÇÃO quando a parte
          concluída era a última pendente; senão, o de PARTE de sempre. */}
      {celebration.lessonJustCompleted && student ? (
        <LessonCompletionDialog
          open={celebration.open}
          onClose={() =>
            setCelebration((c) => ({ ...c, open: false }))
          }
          stars={celebration.stars}
          xpAwarded={celebration.xpAwarded}
          currentStreak={currentStreak ?? 0}
          student={student}
          lessonTitle={lessonTitle ?? ""}
          confettiSeed={celebration.seed}
          courseHref={courseHref}
        />
      ) : (
        <PartCompletionDialog
          open={celebration.open}
          onClose={() =>
            setCelebration((c) => ({ ...c, open: false }))
          }
          stars={celebration.stars}
          xpAwarded={celebration.xpAwarded}
          confettiSeed={celebration.seed}
          courseHref={courseHref}
          nextPartHref={nextPartHref}
        />
      )}
    </div>
  );
}

// Ação no ÚLTIMO bloco da parte. Regra: se a parte está concluída, o aluno
// SEMPRE tem um caminho pra frente aqui.
//
// A celebração (dialog) só aparece na primeira conclusão — antes, quem
// revisitava uma parte já feita via só um "Parte concluída ✓" estático e
// ficava sem saída, tendo que voltar pelo BackLink. Agora o botão de
// avanço é permanente e não depende do dialog.
function FinalAction({
  hasExerciseInPart,
  completed,
  pending,
  canAdvance,
  onMark,
  nextPartHref,
  courseHref,
}: {
  hasExerciseInPart: boolean;
  completed: boolean;
  pending: boolean;
  canAdvance: boolean;
  onMark: () => void;
  nextPartHref?: string;
  courseHref?: string;
}) {
  if (completed) {
    // Próxima parte da mesma lição; se era a última, volta ao curso.
    const href = nextPartHref ?? courseHref;
    if (href) {
      return (
        <Link href={href}>
          <Button type="button" size="sm">
            {nextPartHref ? "Próximo" : "Voltar ao curso"}
          </Button>
        </Link>
      );
    }
    // Sem destino conhecido (caso raro): mantém ao menos a confirmação.
    return (
      <span className="text-sm font-medium text-success">
        Parte concluída ✓
      </span>
    );
  }
  if (hasExerciseInPart) {
    return (
      <span className="text-xs text-fg-tertiary">
        {canAdvance
          ? "Resolva todos os exercícios para concluir a parte."
          : "Responda para continuar."}
      </span>
    );
  }
  // Parte só-conteúdo ainda não concluída: marcar + avançar num clique só.
  // Dispara a server action e abre a celebração (que também leva adiante).
  return (
    <Button type="button" size="sm" loading={pending} onClick={onMark}>
      Próximo
    </Button>
  );
}
