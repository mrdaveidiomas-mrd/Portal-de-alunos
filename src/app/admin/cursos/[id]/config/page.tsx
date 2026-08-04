import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { deleteCourse, updateCourse } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/guard";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

export default async function AdminCourseConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  return (
    <section className="flex flex-col gap-6">
      <Card padded>
        <form action={updateCourse} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={course.id} />
          <input
            name="title"
            defaultValue={course.title}
            className={inputCls}
            placeholder="Título"
          />
          <input
            name="slug"
            defaultValue={course.slug}
            className={inputCls}
            placeholder="slug"
          />
          <textarea
            name="description"
            defaultValue={course.description ?? ""}
            className={`${inputCls} h-20 py-2`}
            placeholder="Descrição"
          />
          <div className="flex gap-3">
            <select
              name="language"
              defaultValue={course.language}
              className={inputCls}
            >
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
            </select>
            <select
              name="level"
              defaultValue={course.level}
              className={inputCls}
            >
              {["a1", "a2", "b1", "b2", "c1", "c2"].map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <Switch
            name="is_published"
            defaultChecked={course.is_published}
            label="Publicado"
            description=""
          />
          <Button type="submit" className="self-start">
            Salvar curso
          </Button>
        </form>
      </Card>

      <Card padded className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-fg-primary">Zona de risco</h2>
        <p className="text-xs text-fg-tertiary">
          Excluir o curso remove módulos, lições, partes, blocos e matrículas
          em cascata. A ação é irreversível.
        </p>
        <form action={deleteCourse}>
          <input type="hidden" name="id" value={course.id} />
          <Button type="submit" variant="danger" size="sm" className="self-start">
            Excluir curso
          </Button>
        </form>
      </Card>
    </section>
  );
}
