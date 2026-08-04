"use client";

import { useRef, useState } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

// Editor visual de tabela (estilo Word/Canva): o admin escolhe o tamanho
// (colunas × linhas), preenche célula a célula e pode adicionar/remover
// linhas e colunas depois. A PRIMEIRA linha é sempre o cabeçalho.
//
// Serialização: o grid inteiro vira JSON num hidden input (`name`), que o
// buildBlockData parseia. Os inputs das células NÃO têm `name` — se
// tivessem, entrariam no FormData e poluiriam o payload.

interface Props {
  name: string;
  // JSON { header: string[], rows: string[][] } do bloco existente.
  initialJson?: string;
  // Autosave debounced do BlockForm (mudança de conteúdo).
  onUpdate?: () => void;
  // Save imediato — usado nas mudanças estruturais (add/remove linha ou
  // coluna), que são clique-único-e-sai e perderiam o debounce.
  onFlush?: () => void;
}

interface Grid {
  header: string[];
  rows: string[][];
}

function parseInitial(json: string | undefined): Grid {
  if (!json) return { header: [], rows: [] };
  try {
    const p = JSON.parse(json) as unknown;
    const obj = (p ?? {}) as { header?: unknown; rows?: unknown };
    const header = Array.isArray(obj.header)
      ? obj.header.map((c) => String(c ?? ""))
      : [];
    const rows = Array.isArray(obj.rows)
      ? obj.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []))
      : [];
    return { header, rows };
  } catch {
    return { header: [], rows: [] };
  }
}

const cellCls =
  "h-9 w-full min-w-28 rounded border border-border-primary bg-bg-primary px-2 text-sm text-fg-primary";

export function TableGridEditor({
  name,
  initialJson,
  onUpdate,
  onFlush,
}: Props) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [grid, setGrid] = useState<Grid>(() => parseInitial(initialJson));
  const [newCols, setNewCols] = useState(3);
  const [newRows, setNewRows] = useState(2);

  const hasTable = grid.header.length > 0;
  const serialized = JSON.stringify(grid);

  // Fonte única de escrita: atualiza o estado e avisa o pai.
  // O `hiddenRef.current.value = ...` imperativo NÃO é redundante: o flush
  // chama runSave() de forma SÍNCRONA, antes do React re-renderizar com o
  // novo state — sem isso o FormData leria o valor anterior. No próximo
  // render o React escreve o mesmo valor (controlado), então não há
  // divergência.
  function commit(next: Grid, flush = false) {
    setGrid(next);
    if (hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(next);
    }
    if (flush) onFlush?.();
    else onUpdate?.();
  }

  function createTable() {
    const cols = Math.max(1, Math.min(8, newCols));
    const bodyRows = Math.max(0, Math.min(30, newRows));
    commit(
      {
        header: Array.from({ length: cols }, () => ""),
        rows: Array.from({ length: bodyRows }, () =>
          Array.from({ length: cols }, () => ""),
        ),
      },
      true,
    );
  }

  function setHeaderCell(c: number, value: string) {
    const header = grid.header.map((cell, i) => (i === c ? value : cell));
    commit({ ...grid, header });
  }

  function setBodyCell(r: number, c: number, value: string) {
    const rows = grid.rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row,
    );
    commit({ ...grid, rows });
  }

  function addColumn() {
    commit(
      {
        header: [...grid.header, ""],
        rows: grid.rows.map((r) => [...r, ""]),
      },
      true,
    );
  }

  function removeColumn(c: number) {
    // Uma tabela sem colunas não existe — o cabeçalho precisa de ao menos 1.
    if (grid.header.length <= 1) return;
    commit(
      {
        header: grid.header.filter((_, i) => i !== c),
        rows: grid.rows.map((r) => r.filter((_, i) => i !== c)),
      },
      true,
    );
  }

  function addRow() {
    commit(
      {
        ...grid,
        rows: [...grid.rows, Array.from({ length: grid.header.length }, () => "")],
      },
      true,
    );
  }

  function removeRow(r: number) {
    commit({ ...grid, rows: grid.rows.filter((_, i) => i !== r) }, true);
  }

  function resetTable() {
    commit({ header: [], rows: [] }, true);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden input que leva o grid inteiro (JSON) para o FormData.
          CONTROLADO pelo state (não `defaultValue`): <input type="hidden">
          não tem "dirty value flag" — o value IDL opera em default mode e
          reflete o atributo — então um `defaultValue` gerenciado pelo React
          sobrescreveria o que escrevemos imperativamente em `commit`. Com o
          state como fonte da verdade, React e o editor sempre concordam. */}
      <input ref={hiddenRef} type="hidden" name={name} value={serialized} readOnly />

      {!hasTable ? (
        // Passo 1: escolher o tamanho — mesma ideia do "inserir tabela" do
        // Word/Canva. Só depois aparece o grid para preencher.
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed border-border-primary p-4">
          <label className="flex flex-col gap-1 text-xs text-fg-secondary">
            Colunas
            <input
              type="number"
              min={1}
              max={8}
              value={newCols}
              onChange={(e) => setNewCols(Number(e.target.value))}
              className="h-9 w-20 rounded border border-border-primary bg-bg-primary px-2 text-sm text-fg-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-fg-secondary">
            Linhas de conteúdo
            <input
              type="number"
              min={0}
              max={30}
              value={newRows}
              onChange={(e) => setNewRows(Number(e.target.value))}
              className="h-9 w-20 rounded border border-border-primary bg-bg-primary px-2 text-sm text-fg-primary"
            />
          </label>
          <Button type="button" size="sm" onClick={createTable}>
            Criar tabela
          </Button>
          <p className="w-full text-xs text-fg-tertiary">
            A primeira linha é o cabeçalho. Dá para adicionar ou remover
            linhas e colunas depois.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1">
              <thead>
                {/* Linha de ações de coluna — remover cada coluna. */}
                <tr>
                  {grid.header.map((_, c) => (
                    <th key={c} className="p-0">
                      <button
                        type="button"
                        onClick={() => removeColumn(c)}
                        disabled={grid.header.length <= 1}
                        aria-label={`Remover coluna ${c + 1}`}
                        title="Remover coluna"
                        className={cn(
                          "mx-auto flex h-5 w-5 items-center justify-center rounded text-fg-tertiary transition-colors",
                          grid.header.length <= 1
                            ? "cursor-not-allowed opacity-30"
                            : "hover:bg-danger-surface hover:text-danger",
                        )}
                      >
                        <XIcon />
                      </button>
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
                {/* Cabeçalho: negrito, para espelhar o <th> do aluno. */}
                <tr>
                  {grid.header.map((cell, c) => (
                    <th key={c} className="p-0">
                      <input
                        value={cell}
                        onChange={(e) => setHeaderCell(c, e.target.value)}
                        placeholder={`Coluna ${c + 1}`}
                        aria-label={`Cabeçalho da coluna ${c + 1}`}
                        className={cn(cellCls, "font-semibold")}
                      />
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row, r) => (
                  <tr key={r}>
                    {grid.header.map((_, c) => (
                      <td key={c} className="p-0">
                        <input
                          value={row[c] ?? ""}
                          onChange={(e) => setBodyCell(r, c, e.target.value)}
                          aria-label={`Linha ${r + 1}, coluna ${c + 1}`}
                          className={cellCls}
                        />
                      </td>
                    ))}
                    <td className="p-0">
                      <button
                        type="button"
                        onClick={() => removeRow(r)}
                        aria-label={`Remover linha ${r + 1}`}
                        title="Remover linha"
                        className="flex h-8 w-8 items-center justify-center rounded text-fg-tertiary transition-colors hover:bg-danger-surface hover:text-danger"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addRow}>
              <PlusIcon className="h-4 w-4" /> Linha
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addColumn}
            >
              <PlusIcon className="h-4 w-4" /> Coluna
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetTable}
              className="text-danger"
            >
              Recomeçar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden="true"
      className="h-3 w-3"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
