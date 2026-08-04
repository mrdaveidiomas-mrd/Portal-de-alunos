// Seed do catálogo de conquistas (v2 — conjuntos com tiers).
// Idempotente por code (unique). Rode com: pnpm seed:achievements
//
// 3 standalone + 6 conjuntos × 3 tiers = 21 conquistas.
// XP NÃO é creditado automaticamente ao bater a condição — o aluno
// precisa "Coletar recompensa" em /painel/conquistas.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam vars no .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Estrutura:
//   set_code: null (standalone) ou string que agrupa os 3 tiers do conjunto
//   tier: null (standalone) ou 1..3
// A ordem do array vira a ordem visual via created_at (vide order by abaixo).
const CATALOG = [
  // Standalones
  {
    code: "first_day",
    title: "Primeiro dia",
    description: "Você estudou pela primeira vez.",
    xp_reward: 25,
    set_code: null,
    tier: null,
  },
  {
    code: "first_lesson",
    title: "Primeira lição",
    description: "Você concluiu sua primeira lição.",
    xp_reward: 25,
    set_code: null,
    tier: null,
  },
  {
    code: "first_bookmark",
    title: "Primeira marcação",
    description: "Você marcou seu primeiro conteúdo para revisar.",
    xp_reward: 25,
    set_code: null,
    tier: null,
  },

  // Conjunto 1 — Estudante (lições concluídas)
  {
    code: "studious_1",
    title: "Estudante aplicado",
    description: "Você estudou 10 lições completas.",
    xp_reward: 100,
    set_code: "studious",
    tier: 1,
  },
  {
    code: "studious_2",
    title: "Estudante modelo",
    description: "Você estudou 30 lições completas.",
    xp_reward: 500,
    set_code: "studious",
    tier: 2,
  },
  {
    code: "studious_3",
    title: "Estudante fenomenal",
    description: "Você estudou 50 lições completas.",
    xp_reward: 1000,
    set_code: "studious",
    tier: 3,
  },

  // Conjunto 2 — Sem erros (lições sem nenhuma tentativa errada)
  {
    code: "flawless_1",
    title: "Sem erros 1",
    description: "Você fez uma lição inteira sem errar nenhum exercício.",
    xp_reward: 100,
    set_code: "flawless",
    tier: 1,
  },
  {
    code: "flawless_2",
    title: "Sem erros 2",
    description: "Você fez 10 lições inteiras sem errar nenhum exercício.",
    xp_reward: 500,
    set_code: "flawless",
    tier: 2,
  },
  {
    code: "flawless_3",
    title: "Sem erros 3",
    description: "Você fez 50 lições inteiras sem errar nenhum exercício.",
    xp_reward: 1000,
    set_code: "flawless",
    tier: 3,
  },

  // Conjunto 3 — Hora de relembrar (revisões SRS)
  {
    code: "reviewer_1",
    title: "Hora de relembrar 1",
    description: "Você revisou 10 exercícios.",
    xp_reward: 100,
    set_code: "reviewer",
    tier: 1,
  },
  {
    code: "reviewer_2",
    title: "Hora de relembrar 2",
    description: "Você revisou 50 exercícios.",
    xp_reward: 500,
    set_code: "reviewer",
    tier: 2,
  },
  {
    code: "reviewer_3",
    title: "Hora de relembrar 3",
    description: "Você revisou 100 exercícios.",
    xp_reward: 1000,
    set_code: "reviewer",
    tier: 3,
  },

  // Conjunto 4 — Período perfeito (streak)
  {
    code: "perfect_week",
    title: "Semana perfeita",
    description: "Você estudou uma semana inteira sem falhar nenhum dia.",
    xp_reward: 100,
    set_code: "perfect_period",
    tier: 1,
  },
  {
    code: "perfect_month",
    title: "Mês perfeito",
    description: "Você estudou um mês inteiro sem falhar nenhum dia.",
    xp_reward: 1000,
    set_code: "perfect_period",
    tier: 2,
  },
  {
    code: "perfect_semester",
    title: "Semestre perfeito",
    description: "Você estudou um semestre inteiro sem falhar nenhum dia.",
    xp_reward: 10000,
    set_code: "perfect_period",
    tier: 3,
  },

  // Conjunto 5 — Louco por XP
  {
    code: "xp_addict_1",
    title: "Louco por XP 1",
    description: "Você conseguiu 1.000 XP.",
    xp_reward: 100,
    set_code: "xp_addict",
    tier: 1,
  },
  {
    code: "xp_addict_2",
    title: "Louco por XP 2",
    description: "Você conseguiu 10.000 XP.",
    xp_reward: 500,
    set_code: "xp_addict",
    tier: 2,
  },
  {
    code: "xp_addict_3",
    title: "Louco por XP 3",
    description: "Você conseguiu 50.000 XP.",
    xp_reward: 1000,
    set_code: "xp_addict",
    tier: 3,
  },

  // Conjunto 6 — Colecionador de estrelas
  {
    code: "star_collector_1",
    title: "Colecionador de estrelas 1",
    description: "Você acumulou 10 estrelas.",
    xp_reward: 100,
    set_code: "star_collector",
    tier: 1,
  },
  {
    code: "star_collector_2",
    title: "Colecionador de estrelas 2",
    description: "Você acumulou 100 estrelas.",
    xp_reward: 500,
    set_code: "star_collector",
    tier: 2,
  },
  {
    code: "star_collector_3",
    title: "Colecionador de estrelas 3",
    description: "Você acumulou 500 estrelas.",
    xp_reward: 1000,
    set_code: "star_collector",
    tier: 3,
  },
];

const { data: existing } = await admin
  .from("achievements")
  .select("code, id");
const byCode = new Map((existing ?? []).map((a) => [a.code, a.id]));

let inserted = 0,
  updated = 0;
for (const entry of CATALOG) {
  if (byCode.has(entry.code)) {
    await admin.from("achievements").update(entry).eq("code", entry.code);
    updated++;
  } else {
    await admin.from("achievements").insert(entry);
    inserted++;
  }
}
console.log(
  `Conquistas: ${inserted} novas, ${updated} atualizadas, total ${CATALOG.length}.`,
);
