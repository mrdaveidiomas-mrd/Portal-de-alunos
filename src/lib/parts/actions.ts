"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { EXERCISE_TYPES } from "@/lib/blocks/schemas";
import { awardAchievements } from "@/lib/achievements/award";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface MarkPartCompletedResult {
  ok: boolean;
  error: string | null;
  // True quando a parte transicionou agora para completed (e o cliente
  // deve mostrar a celebração).
  justCompleted?: boolean;
  // True quando a parte concluída ERA a última parte pendente da lição
  // — usado para abrir o diálogo de celebração de LIÇÃO (mais polido e
  // com compartilhamento). Só é true junto de justCompleted.
  lessonJustCompleted?: boolean;
  // XP creditado nesta conclusão (bônus de "part_completed"). 0 se
  // a parte já estava concluída antes.
  xpAwarded?: number;
}

// Marca a parte como concluída manualmente, para partes SEM exercícios.
// Quando há exercícios, a conclusão vem automaticamente de recomputePartProgress
// — esta action recusa para não bagunçar o caminho automático.
//
// Defesa em profundidade:
//  - autenticação do usuário
//  - matrícula ativa no curso da parte (ou modo pré-visualização admin)
//  - confirmação de que a parte realmente NÃO tem blocks de exercício
export async function markPartCompleted(
  partId: string,
  previewMode?: boolean,
): Promise<MarkPartCompletedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Honra previewMode somente para admin.
  let isAdminPreview = false;
  if (previewMode) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdminPreview = profile?.role === "admin";
  }

  const { data: part } = await admin
    .from("parts")
    .select("id, course_id")
    .eq("id", partId)
    .maybeSingle();
  if (!part) return { ok: false, error: "Parte não encontrada." };

  if (!isAdminPreview) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", part.course_id)
      .eq("status", "active")
      .maybeSingle();
    if (!enrollment) {
      return { ok: false, error: "Você não está matriculado neste curso." };
    }
  }

  // Bloqueia partes com exercícios — elas concluem automaticamente.
  const { data: exerciseBlocks } = await admin
    .from("blocks")
    .select("id")
    .eq("part_id", partId)
    .in("type", EXERCISE_TYPES)
    .limit(1);
  if ((exerciseBlocks ?? []).length > 0) {
    return {
      ok: false,
      error: "Esta parte conclui automaticamente ao acertar os exercícios.",
    };
  }

  // Dry-run admin: devolve ok=true sem persistir nada (zero conquistas,
  // zero part_progress, zero revalidate).
  if (isAdminPreview) {
    return { ok: true, error: null, justCompleted: false };
  }

  // Idempotente: se já está completed, não duplica completed_at.
  const { data: existing } = await admin
    .from("part_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("part_id", partId)
    .maybeSingle();
  const wasCompleted = existing?.status === "completed";

  await admin.from("part_progress").upsert(
    {
      user_id: user.id,
      part_id: partId,
      course_id: part.course_id,
      status: "completed",
      // Sem exercícios não há "estrelas" — fica 0; aluno terminou o conteúdo.
      stars: 0,
      score: null,
      completed_at: wasCompleted
        ? (undefined as never)
        : new Date().toISOString(),
    },
    { onConflict: "user_id,part_id" },
  );

  // Bônus de conclusão de parte — partes só de conteúdo (sem
  // exercícios) não geravam nenhum xp_event, então o trigger
  // apply_xp_event() nunca era chamado e o streak não subia naquele
  // dia. Inserimos um pequeno xp_event aqui para que QUALQUER parte
  // terminada conte para streak. Só na transição (idempotência).
  // Partes com exercícios já têm xp_events próprios via submitExercise,
  // então essa branch não duplica nada.
  let xpAwarded = 0;
  if (!wasCompleted) {
    xpAwarded = 5;
    await admin.from("xp_events").insert({
      user_id: user.id,
      amount: xpAwarded,
      source: "part_completed",
      part_id: partId,
    });
  }

  // Conquistas que dependem de progresso podem ser disparadas.
  await awardAchievements(admin, {
    userId: user.id,
    courseId: part.course_id,
    partId,
  });

  revalidatePath(`/partes/${partId}`);

  const lessonJustCompleted = !wasCompleted
    ? await checkLessonJustCompleted(admin, user.id, partId)
    : false;

  return {
    ok: true,
    error: null,
    justCompleted: !wasCompleted,
    lessonJustCompleted,
    xpAwarded,
  };
}

// Após o upsert que transicionou a parte para "completed", verifica se
// esta era a ÚLTIMA parte da lição ainda pendente. Como roda DEPOIS do
// upsert, basta contar quantas partes da lição estão completed para o
// user vs quantas existem. Reutilizado pelo submitExercise.
export async function checkLessonJustCompleted(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  partId: string,
): Promise<boolean> {
  const { data: part } = await admin
    .from("parts")
    .select("lesson_id")
    .eq("id", partId)
    .maybeSingle();
  if (!part?.lesson_id) return false;

  const { data: allParts } = await admin
    .from("parts")
    .select("id")
    .eq("lesson_id", part.lesson_id);
  const total = allParts?.length ?? 0;
  if (total === 0) return false;

  const ids = (allParts ?? []).map((p) => p.id);
  const { count } = await admin
    .from("part_progress")
    .select("part_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("part_id", ids)
    .eq("status", "completed");

  return (count ?? 0) >= total;
}

export interface RetryPartResult {
  ok: boolean;
  error: string | null;
}

// "Tentar de novo" para subir estrelas: apaga TODAS as tentativas dos
// exercícios da parte e volta o progresso para in_progress. O aluno
// refaz desde o começo — se acertar tudo de primeira agora, vira 3
// estrelas.
//
// Restrições:
//   - Precisa estar autenticado e matriculado.
//   - Parte precisa ter exercícios (faz sentido só onde estrelas existem).
//   - Progresso precisa estar completed com stars < 3 (não há o que
//     melhorar se já tem 3 estrelas; e se está in_progress, não há
//     histórico para zerar).
export async function retryPartExercises(
  partId: string,
): Promise<RetryPartResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: part } = await admin
    .from("parts")
    .select("id, course_id")
    .eq("id", partId)
    .maybeSingle();
  if (!part) return { ok: false, error: "Parte não encontrada." };

  // Matrícula ativa
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", part.course_id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) {
    return { ok: false, error: "Você não está matriculado neste curso." };
  }

  // Precisa ter exercícios
  const { data: exerciseBlocks } = await admin
    .from("blocks")
    .select("id")
    .eq("part_id", partId)
    .in("type", EXERCISE_TYPES)
    .limit(1);
  if ((exerciseBlocks ?? []).length === 0) {
    return {
      ok: false,
      error: "Esta parte não tem exercícios para refazer.",
    };
  }

  // Só faz sentido se está completed e ainda dá pra melhorar (stars < 3)
  const { data: progress } = await admin
    .from("part_progress")
    .select("status, stars")
    .eq("user_id", user.id)
    .eq("part_id", partId)
    .maybeSingle();
  if (!progress || progress.status !== "completed") {
    return {
      ok: false,
      error: "Termine a parte antes de tentar de novo.",
    };
  }
  if (progress.stars >= 3) {
    return {
      ok: false,
      error: "Você já tem 3 estrelas nesta parte!",
    };
  }

  // Reset total: apaga tentativas e volta a parte para in_progress (0
  // estrelas, sem completed_at). O aluno refaz cada exercício e o
  // recomputePartProgress vai reescrever stars conforme avança.
  await admin
    .from("exercise_attempts")
    .delete()
    .eq("user_id", user.id)
    .eq("part_id", partId);
  await admin
    .from("part_progress")
    .update({
      status: "in_progress",
      stars: 0,
      score: null,
      completed_at: null,
    })
    .eq("user_id", user.id)
    .eq("part_id", partId);

  revalidatePath(`/partes/${partId}`);

  return { ok: true, error: null };
}
