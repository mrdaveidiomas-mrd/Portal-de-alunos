import type { Tables } from "@/types/database";

// Tipos de domínio da gamificação, derivados do schema gerado. Importe daqui
// (não redefina localmente) — ver CLAUDE.md.
export type UserGamification = Tables<"user_gamification">;
export type XpEvent = Tables<"xp_events">;
export type Achievement = Tables<"achievements">;
export type UserAchievement = Tables<"user_achievements">;
