"use client";

import { SortableList } from "@/components/admin/SortableList";
import { reorderModules } from "@/lib/admin/actions";

// Lista de módulos com drag-and-drop. Os cards são pré-renderizados no
// servidor (porque contêm Server Components / Server Actions) e
// recebidos como children mapeados por id.
export function SortableModulesList({
  courseId,
  items,
}: {
  courseId: string;
  items: { id: string; content: React.ReactNode }[];
}) {
  return (
    <SortableList
      items={items}
      className="flex flex-col gap-4"
      successMessage="Módulos reordenados"
      onReorder={async (ids) => {
        await reorderModules(courseId, ids);
      }}
    />
  );
}
