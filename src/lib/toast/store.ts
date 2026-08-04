"use client";

// Store global de toasts — module-level, sem Provider/Context.
// O componente <ToastViewport> assina com useSyncExternalStore e renderiza
// a lista; qualquer client component pode disparar via `toast.success(...)`.

import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "warning" | "danger" | "info";

export interface ToastInput {
  kind?: ToastKind;
  title: string;
  description?: string;
  // ms até auto-dismiss; 0 = persistente até clicar.
  durationMs?: number;
}

export interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
  durationMs: number;
  // Marca para iniciar a animação de saída antes do unmount.
  leaving?: boolean;
}

const DEFAULTS: Record<ToastKind, { duration: number }> = {
  success: { duration: 3500 },
  warning: { duration: 4500 },
  danger: { duration: 5500 },
  info: { duration: 3500 },
};

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();

// Referência estável para o snapshot do servidor. useSyncExternalStore exige
// que getServerSnapshot devolva o MESMO objeto entre chamadas — devolver um
// `[]` novo a cada vez dispara o warning "getServerSnapshot should be cached
// to avoid an infinite loop" e re-renderiza em loop durante a hidratação.
const EMPTY_SERVER_SNAPSHOT: ToastItem[] = [];

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ToastItem[] {
  return items;
}

function getServerSnapshot(): ToastItem[] {
  return EMPTY_SERVER_SNAPSHOT;
}

function push(input: ToastInput): number {
  const kind = input.kind ?? "info";
  const durationMs = input.durationMs ?? DEFAULTS[kind].duration;
  const id = nextId++;
  const item: ToastItem = {
    id,
    kind,
    title: input.title,
    description: input.description,
    durationMs,
  };
  items = [...items, item];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }
  return id;
}

export function dismiss(id: number): void {
  // Marca para sair (anima) e depois remove de fato.
  const idx = items.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const target = items[idx];
  if (!target || target.leaving) return;
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 200);
}

// API pública.
export const toast = {
  success: (input: Omit<ToastInput, "kind">) => push({ ...input, kind: "success" }),
  warning: (input: Omit<ToastInput, "kind">) => push({ ...input, kind: "warning" }),
  danger: (input: Omit<ToastInput, "kind">) => push({ ...input, kind: "danger" }),
  info: (input: Omit<ToastInput, "kind">) => push({ ...input, kind: "info" }),
  dismiss,
};

// Hook usado SOMENTE pelo viewport.
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
