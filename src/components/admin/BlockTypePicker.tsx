"use client";

import { useState, useTransition } from "react";

import {
  CONTENT_TYPES,
  EXERCISE_TYPES_PICKER,
  type BlockTypeEntry,
} from "@/components/admin/block-types";
import { createBlock } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils/cn";

// Picker de "Novo bloco". Clicar num tipo CRIA o bloco na hora (vazio) e
// ele aparece logo acima, na lista, já em modo de edição com autosave.
// O picker em si nunca vira formulário — some a confusão de editar dentro
// do card de escolha e de ter que "trocar tipo" depois.
export function BlockTypePicker({ partId }: { partId: string }) {
  const [pending, startTransition] = useTransition();
  // Qual card está sendo criado — para dar feedback só nele.
  const [adding, setAdding] = useState<string | null>(null);

  function add(entry: BlockTypeEntry) {
    if (pending) return;
    setAdding(entry.value);
    // createBlock lê part_id + type do FormData. Sem os campos de conteúdo,
    // buildBlockData devolve o payload vazio do tipo — o bloco nasce em
    // branco e o admin preenche no editor logo acima (autosave).
    const fd = new FormData();
    fd.set("part_id", partId);
    fd.set("type", entry.value);
    startTransition(async () => {
      try {
        await createBlock(fd);
        toast.success({
          title: `Bloco "${entry.label}" adicionado`,
          description: "Preencha o conteúdo acima.",
        });
      } catch {
        toast.danger({
          title: "Não consegui adicionar o bloco",
          description: "Tente de novo em instantes.",
        });
      } finally {
        setAdding(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <TypeGroup
        title="Conteúdo lecionado"
        subtitle="Blocos que apresentam o conteúdo da parte."
        items={CONTENT_TYPES}
        onPick={add}
        pending={pending}
        adding={adding}
      />
      <TypeGroup
        title="Exercícios autocorrigidos"
        subtitle="Blocos com correção automática e XP."
        items={EXERCISE_TYPES_PICKER}
        onPick={add}
        pending={pending}
        adding={adding}
      />
    </div>
  );
}

function TypeGroup({
  title,
  subtitle,
  items,
  onPick,
  pending,
  adding,
}: {
  title: string;
  subtitle: string;
  items: BlockTypeEntry[];
  onPick: (entry: BlockTypeEntry) => void;
  pending: boolean;
  adding: string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
        <p className="text-xs text-fg-secondary">{subtitle}</p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it) => {
          const isAdding = adding === it.value;
          return (
            <li key={it.value}>
              <button
                type="button"
                onClick={() => onPick(it)}
                disabled={pending}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2.5 text-left transition-colors",
                  pending
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-primary-brand/40 hover:bg-primary-brand-surface",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary text-fg-secondary transition-colors group-hover:bg-primary-brand-surface group-hover:text-primary-brand">
                  {isAdding ? <Spinner /> : it.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-fg-primary group-hover:text-primary-brand">
                    {it.label}
                  </span>
                  <span className="truncate text-xs text-fg-tertiary">
                    {isAdding ? "Adicionando…" : it.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-30"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
