import type { Enums, Tables } from "@/types/database";

// Tipos de domínio do conteúdo, derivados do schema gerado. Importe daqui
// (não redefina localmente) — ver CLAUDE.md.
export type Course = Tables<"courses">;
export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type Part = Tables<"parts">;
export type Block = Tables<"blocks">;
export type Enrollment = Tables<"enrollments">;
export type PartProgress = Tables<"part_progress">;

export type CourseLanguage = Enums<"course_language">;
export type CefrLevel = Enums<"cefr_level">;
export type PartKind = Enums<"part_kind">;
export type ProgressStatus = Enums<"progress_status">;
