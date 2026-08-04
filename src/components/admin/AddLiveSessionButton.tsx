"use client";

import { useState } from "react";

import {
  LiveSessionDialog,
  type TeacherOption,
} from "@/components/admin/LiveSessionDialog";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";

export function AddLiveSessionButton({
  studentId,
  teachers,
}: {
  studentId: string;
  teachers: TeacherOption[];
}) {
  const [open, setOpen] = useState(false);
  const disabled = teachers.length === 0;
  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={
          disabled
            ? "Vincule um professor a este aluno antes de cadastrar aulas."
            : undefined
        }
      >
        <PlusIcon className="h-4 w-4" />
        Cadastrar aula
      </Button>
      <LiveSessionDialog
        open={open}
        onClose={() => setOpen(false)}
        studentId={studentId}
        teachers={teachers}
      />
    </>
  );
}
