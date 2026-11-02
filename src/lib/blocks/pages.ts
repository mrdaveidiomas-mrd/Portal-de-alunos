// Agrupa os blocos de uma parte em "páginas": um texto base (`passage`) e as
// perguntas ligadas a ele formam UMA página; qualquer outro bloco fica sozinho.
//
// O vínculo mora na PERGUNTA (`data.passageId`), não numa estrutura aninhada:
// cada pergunta segue sendo um bloco próprio, então gabarito, tentativas, XP e
// estrelas (todos por block_id) não mudam. Vínculo órfão, de um texto base
// excluído, é ignorado e a pergunta volta a ser avulsa.

interface BlockLike {
  id: string;
  type: string;
  position: number;
  data: unknown;
}

export interface BlockPage<T> {
  passage: T | null;
  items: T[];
}

export function passageIdOf(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const id = (data as { passageId?: unknown }).passageId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

// A posição de cada página é a do texto base; as perguntas não precisam estar
// logo depois dele e seguem a ordem das próprias posições.
export function groupBlocksIntoPages<T extends BlockLike>(
  blocks: readonly T[],
): BlockPage<T>[] {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const itemsByPassage = new Map<string, T[]>();
  for (const block of sorted) {
    if (block.type === "passage") itemsByPassage.set(block.id, []);
  }

  const pages: BlockPage<T>[] = [];
  for (const block of sorted) {
    if (block.type === "passage") {
      pages.push({ passage: block, items: itemsByPassage.get(block.id) ?? [] });
      continue;
    }
    const passageId = passageIdOf(block.data);
    const items = passageId ? itemsByPassage.get(passageId) : undefined;
    if (items) items.push(block);
    else pages.push({ passage: null, items: [block] });
  }
  return pages;
}

// Onde o aluno retoma a parte: na primeira pergunta ainda não acertada. Se ele
// nunca tentou essa pergunta, volta ao conteúdo logo antes dela, que talvez não
// tenha lido; numa primeira visita, isso é o início da parte.
export function resumePageIndex<T extends BlockLike>(
  pages: readonly BlockPage<T>[],
  {
    isExercise,
    solvedIds,
    attemptedIds,
  }: {
    isExercise: (type: string) => boolean;
    solvedIds: ReadonlySet<string>;
    attemptedIds: ReadonlySet<string>;
  },
): number {
  const exercisesAt = (i: number) =>
    (pages[i]?.items ?? []).filter((b) => isExercise(b.type));

  const pending = pages.findIndex((_, i) =>
    exercisesAt(i).some((b) => !solvedIds.has(b.id)),
  );
  if (pending < 0) return 0;
  if (exercisesAt(pending).some((b) => attemptedIds.has(b.id))) return pending;

  let start = pending;
  while (start > 0 && exercisesAt(start - 1).length === 0) start--;
  return start;
}

// Com quem um bloco troca de lugar ao subir/descer: uma pergunta se move entre
// as perguntas do mesmo texto; os demais, entre as páginas da parte.
export function moveSiblings<T extends BlockLike>(
  blocks: readonly T[],
  id: string,
): T[] {
  const pages = groupBlocksIntoPages(blocks);
  const group = pages.find(
    (page) => page.passage && page.items.some((item) => item.id === id),
  );
  if (group) return group.items;
  return pages.flatMap((page) => {
    const head = page.passage ?? page.items[0];
    return head ? [head] : [];
  });
}
