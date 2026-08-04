"use client";

import { useMemo, useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { assignStudentToTeacher } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

export interface StudentOption {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

// Dialog para vincular alunos a um professor. Mostra todos os alunos
// disponíveis (não vinculados ainda), filtra por busca de texto, e o
// admin pode marcar quantos quiser — não há limite por design.
export function AssignStudentDialog({
  teacherId,
  available,
}: {
  teacherId: string;
  available: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.fullName ?? "").toLowerCase().includes(q),
    );
  }, [available, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setQuery("");
    setSelected(new Set());
  }

  function handleSubmit() {
    if (pending || selected.size === 0) return;
    startTransition(async () => {
      let added = 0;
      for (const studentId of selected) {
        const fd = new FormData();
        fd.set("teacher_id", teacherId);
        fd.set("student_id", studentId);
        const res = await assignStudentToTeacher(fd);
        if (res.ok) added++;
      }
      if (added > 0) {
        toast.success({
          title: `${added} ${added === 1 ? "aluno vinculado" : "alunos vinculados"}`,
        });
      }
      close();
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Vincular aluno
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Vincular alunos"
        description="Selecione um ou mais alunos para que este professor acompanhe o progresso deles."
      >
        <div className="flex flex-col gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            autoFocus
          />

          {available.length === 0 ? (
            <p className="text-sm text-fg-secondary">
              Todos os alunos cadastrados já estão vinculados a este
              professor.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-fg-tertiary">
              Nenhum aluno corresponde à busca.
            </p>
          ) : (
            <ul className="flex max-h-[50vh] flex-col divide-y divide-border-primary overflow-y-auto rounded-md border border-border-primary">
              {filtered.map((s) => {
                const checked = selected.has(s.id);
                return (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-bg-tertiary">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(s.id)}
                        className="h-4 w-4 accent-primary-brand"
                      />
                      <Avatar
                        src={s.avatarUrl}
                        fullName={s.fullName}
                        email={s.email}
                        size="sm"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm text-fg-primary">
                          {s.fullName ?? s.email}
                        </span>
                        {s.fullName && (
                          <span className="text-xs text-fg-tertiary">
                            {s.email}
                          </span>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              loading={pending}
              disabled={selected.size === 0}
            >
              Vincular
              {selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
