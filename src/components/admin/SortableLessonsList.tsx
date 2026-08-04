"use client";

import { SortableList } from "@/components/admin/SortableList";
import { reorderLessons } from "@/lib/admin/actions";

export function SortableLessonsList({
  moduleId,
  courseId,
  items,
}: {
  moduleId: string;
  courseId: string;
  items: { id: string; content: React.ReactNode }[];
}) {
  return (
    <SortableList
      items={items}
      className="flex flex-col divide-y divide-border-primary"
      successMessage="Lições reordenadas"
      onReorder={async (ids) => {
        await reorderLessons(moduleId, courseId, ids);
      }}
    />
  );
}
