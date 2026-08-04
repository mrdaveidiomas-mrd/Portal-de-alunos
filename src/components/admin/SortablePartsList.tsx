"use client";

import { SortableList } from "@/components/admin/SortableList";
import { reorderParts } from "@/lib/admin/actions";

export function SortablePartsList({
  lessonId,
  items,
}: {
  lessonId: string;
  items: { id: string; content: React.ReactNode }[];
}) {
  return (
    <SortableList
      items={items}
      className="flex flex-col gap-4"
      successMessage="Partes reordenadas"
      onReorder={async (ids) => {
        await reorderParts(lessonId, ids);
      }}
    />
  );
}
