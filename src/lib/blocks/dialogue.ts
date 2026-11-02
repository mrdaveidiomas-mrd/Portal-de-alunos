// Formato de edição do bloco de diálogo, compartilhado pelo editor do admin (que
// lista os personagens enquanto o texto é digitado) e pela Server Action.

export type SpeakerGender = "female" | "male";

export interface DialogueLine {
  speaker: string;
  text: string;
}

// Uma fala por linha: "Personagem: texto". Só o primeiro ":" separa, então o
// texto pode conter outros. Linha sem ":" vira fala sem personagem.
export function parseDialogueLines(raw: string): DialogueLine[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i >= 0
        ? { speaker: line.slice(0, i).trim(), text: line.slice(i + 1).trim() }
        : { speaker: "", text: line };
    });
}

// Personagens na ordem em que aparecem, sem repetir.
export function speakersOf(lines: readonly DialogueLine[]): string[] {
  return [...new Set(lines.map((l) => l.speaker).filter(Boolean))];
}

// Lê o JSON do editor. Guarda só gêneros válidos de personagens que ainda têm
// fala: quem é renomeado ou removido não deixa escolha órfã no bloco. JSON
// quebrado vira "sem escolha" (voz automática) em vez de derrubar o autosave.
export function parseSpeakerGenders(
  raw: string,
  lines: readonly DialogueLine[],
): Record<string, SpeakerGender> | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;

  const source = parsed as Record<string, unknown>;
  const entries = speakersOf(lines).flatMap((speaker): [string, SpeakerGender][] => {
    if (!Object.hasOwn(source, speaker)) return [];
    const gender = source[speaker];
    return gender === "female" || gender === "male" ? [[speaker, gender]] : [];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
