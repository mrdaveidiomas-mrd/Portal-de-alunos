"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  createLiveSession,
  updateLiveSession,
} from "@/lib/live-sessions/actions";
import { DAY_LABELS } from "@/lib/live-sessions/queries";
import { toast } from "@/lib/toast/store";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

// Select com chevron customizado: a seta nativa fica colada na borda
// e o espaçamento varia por navegador. Aqui usamos appearance-none + um
// SVG via background-image, posicionado com `right 12px`. O `pr-10`
// reserva espaço pra seta não invadir o texto. Cor da seta vem de
// currentColor convertida pra URL-encoded.
const selectCls = `${inputCls} appearance-none pr-10 bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:1rem_1rem] bg-[image:url("data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%23737373'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%2F%3E%3C%2Fsvg%3E")]`;

export interface TeacherOption {
  id: string;
  fullName: string | null;
  email: string;
}

export interface LiveSessionInitial {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM" ou "HH:MM:SS"
  meetUrl: string;
}

// Dialog controlado para criar ou editar uma aula síncrona. Quando
// `initial` é fornecido, atualiza; caso contrário, cria.
export function LiveSessionDialog({
  open,
  onClose,
  studentId,
  teachers,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  teachers: TeacherOption[];
  initial?: LiveSessionInitial;
}) {
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = editing ? updateLiveSession : createLiveSession;
      const res = await action(formData);
      if (res.ok) {
        toast.success({
          title: editing ? "Aula atualizada" : "Aula cadastrada",
        });
        onClose();
      } else if (res.error) {
        toast.danger({ title: res.error });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title={editing ? "Editar aula" : "Cadastrar aula síncrona"}
    >
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="student_id" value={studentId} />
        {initial && <input type="hidden" name="id" value={initial.id} />}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-fg-primary">Professor</span>
          {teachers.length === 0 ? (
            <p className="text-xs text-danger">
              Vincule um professor a este aluno antes de cadastrar uma aula.
            </p>
          ) : (
            <select
              name="teacher_id"
              defaultValue={initial?.teacherId ?? teachers[0]?.id ?? ""}
              required
              className={selectCls}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName ?? t.email}
                </option>
              ))}
            </select>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-fg-primary">Dia da semana</span>
            <select
              name="day_of_week"
              defaultValue={initial?.dayOfWeek ?? 1}
              required
              className={selectCls}
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-fg-primary">Horário</span>
            <input
              type="time"
              name="start_time"
              defaultValue={(initial?.startTime ?? "19:00").slice(0, 5)}
              required
              className={inputCls}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-fg-primary">Link da aula</span>
          <input
            type="url"
            name="meet_url"
            defaultValue={initial?.meetUrl ?? ""}
            placeholder="https://meet.google.com/abc-defg-hij"
            required
            className={inputCls}
          />
          <span className="text-xs text-fg-tertiary">
            Cole o link da aula que o aluno verá em seu painel.
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={pending}
            disabled={teachers.length === 0}
          >
            {editing ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
