// Catálogo de conquistas — espelho do que vive em `public.achievements`.
// Mantemos os códigos, set_codes e thresholds em código para a lógica de
// awardAchievements/claimAchievement ser auto-contida. A tabela continua
// sendo a fonte da verdade para títulos/descrições/recompensas — código
// só usa para checar condições.

export type AchievementCode =
  // Standalones
  | "first_day"
  | "first_lesson"
  | "first_bookmark"
  // Conjunto: lições concluídas
  | "studious_1"
  | "studious_2"
  | "studious_3"
  // Conjunto: lições perfeitas (sem qualquer erro)
  | "flawless_1"
  | "flawless_2"
  | "flawless_3"
  // Conjunto: revisões SRS
  | "reviewer_1"
  | "reviewer_2"
  | "reviewer_3"
  // Conjunto: streak
  | "perfect_week"
  | "perfect_month"
  | "perfect_semester"
  // Conjunto: XP acumulado
  | "xp_addict_1"
  | "xp_addict_2"
  | "xp_addict_3"
  // Conjunto: estrelas acumuladas
  | "star_collector_1"
  | "star_collector_2"
  | "star_collector_3";

export type SetCode =
  | "studious"
  | "flawless"
  | "reviewer"
  | "perfect_period"
  | "xp_addict"
  | "star_collector";

// Métricas calculadas a partir do estado do usuário. Threshold de cada
// conquista compara contra um destes campos.
export interface UserMetrics {
  hasFirstDay: boolean;
  lessonsCompleted: number;
  lessonsFlawless: number;
  srsReviews: number;
  longestStreak: number;
  totalXp: number;
  totalStars: number;
  hasBookmark: boolean;
}

export interface CatalogEntry {
  code: AchievementCode;
  // Predicado contra as métricas. true = condição atingida.
  reached: (m: UserMetrics) => boolean;
}

// IMPORTANTE: thresholds aqui devem bater 1:1 com a tabela achievements.
// Se mudar valor lá, mudar aqui também.
export const CATALOG: CatalogEntry[] = [
  // Standalones
  { code: "first_day", reached: (m) => m.hasFirstDay },
  { code: "first_lesson", reached: (m) => m.lessonsCompleted >= 1 },
  { code: "first_bookmark", reached: (m) => m.hasBookmark },

  // Conjunto 1: studious
  { code: "studious_1", reached: (m) => m.lessonsCompleted >= 10 },
  { code: "studious_2", reached: (m) => m.lessonsCompleted >= 30 },
  { code: "studious_3", reached: (m) => m.lessonsCompleted >= 50 },

  // Conjunto 2: flawless
  { code: "flawless_1", reached: (m) => m.lessonsFlawless >= 1 },
  { code: "flawless_2", reached: (m) => m.lessonsFlawless >= 10 },
  { code: "flawless_3", reached: (m) => m.lessonsFlawless >= 50 },

  // Conjunto 3: reviewer
  { code: "reviewer_1", reached: (m) => m.srsReviews >= 10 },
  { code: "reviewer_2", reached: (m) => m.srsReviews >= 50 },
  { code: "reviewer_3", reached: (m) => m.srsReviews >= 100 },

  // Conjunto 4: perfect_period (usa longestStreak — basta ter atingido
  // uma vez na vida; não precisa estar no streak atual)
  { code: "perfect_week", reached: (m) => m.longestStreak >= 7 },
  { code: "perfect_month", reached: (m) => m.longestStreak >= 30 },
  { code: "perfect_semester", reached: (m) => m.longestStreak >= 180 },

  // Conjunto 5: xp_addict
  { code: "xp_addict_1", reached: (m) => m.totalXp >= 1_000 },
  { code: "xp_addict_2", reached: (m) => m.totalXp >= 10_000 },
  { code: "xp_addict_3", reached: (m) => m.totalXp >= 50_000 },

  // Conjunto 6: star_collector
  { code: "star_collector_1", reached: (m) => m.totalStars >= 10 },
  { code: "star_collector_2", reached: (m) => m.totalStars >= 100 },
  { code: "star_collector_3", reached: (m) => m.totalStars >= 500 },
];

// Para a UI: ordem dos conjuntos e seus tiers.
export const SET_TIERS: Record<SetCode, AchievementCode[]> = {
  studious: ["studious_1", "studious_2", "studious_3"],
  flawless: ["flawless_1", "flawless_2", "flawless_3"],
  reviewer: ["reviewer_1", "reviewer_2", "reviewer_3"],
  perfect_period: ["perfect_week", "perfect_month", "perfect_semester"],
  xp_addict: ["xp_addict_1", "xp_addict_2", "xp_addict_3"],
  star_collector: [
    "star_collector_1",
    "star_collector_2",
    "star_collector_3",
  ],
};

export const STANDALONE_CODES: AchievementCode[] = [
  "first_day",
  "first_lesson",
  "first_bookmark",
];

// Thresholds explicitos por code, usados pela UI para mostrar barra de
// progresso (ex: "8/10 lições"). Para os de progresso numérico.
export const THRESHOLDS: Partial<Record<AchievementCode, number>> = {
  studious_1: 10,
  studious_2: 30,
  studious_3: 50,
  flawless_1: 1,
  flawless_2: 10,
  flawless_3: 50,
  reviewer_1: 10,
  reviewer_2: 50,
  reviewer_3: 100,
  perfect_week: 7,
  perfect_month: 30,
  perfect_semester: 180,
  xp_addict_1: 1_000,
  xp_addict_2: 10_000,
  xp_addict_3: 50_000,
  star_collector_1: 10,
  star_collector_2: 100,
  star_collector_3: 500,
};

// Para a barra de progresso: qual métrica corresponde a cada code.
export const METRIC_FOR_CODE: Partial<
  Record<AchievementCode, keyof UserMetrics>
> = {
  studious_1: "lessonsCompleted",
  studious_2: "lessonsCompleted",
  studious_3: "lessonsCompleted",
  flawless_1: "lessonsFlawless",
  flawless_2: "lessonsFlawless",
  flawless_3: "lessonsFlawless",
  reviewer_1: "srsReviews",
  reviewer_2: "srsReviews",
  reviewer_3: "srsReviews",
  perfect_week: "longestStreak",
  perfect_month: "longestStreak",
  perfect_semester: "longestStreak",
  xp_addict_1: "totalXp",
  xp_addict_2: "totalXp",
  xp_addict_3: "totalXp",
  star_collector_1: "totalStars",
  star_collector_2: "totalStars",
  star_collector_3: "totalStars",
};

export const SET_LABELS: Record<SetCode, string> = {
  studious: "Estudante",
  flawless: "Sem erros",
  reviewer: "Hora de relembrar",
  perfect_period: "Período perfeito",
  xp_addict: "Louco por XP",
  star_collector: "Colecionador de estrelas",
};
