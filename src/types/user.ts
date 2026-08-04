import type { Tables, Enums } from "@/types/database";

// Tipos de domínio derivados do schema gerado. Importe daqui (não redefina
// localmente) — ver CLAUDE.md.
export type Profile = Tables<"profiles">;
export type UserRole = Enums<"user_role">;
