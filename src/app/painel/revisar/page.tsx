import Link from "next/link";
import { redirect } from "next/navigation";

import { BookmarkIcon } from "@/components/icons/BookmarkIcon";
import { InboxIllustration } from "@/components/illustrations/InboxIllustration";
import { BackLink } from "@/components/shared/BackLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { toggleReviewMark } from "@/lib/review/actions";
import { countDueItems } from "@/lib/srs/queries";
import { createClient } from "@/lib/supabase/server";

export default async function RevisarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS já filtra para o usuário; trazemos parte + lição + curso aninhados.
  const [{ data: marks }, dueCount] = await Promise.all([
    supabase
      .from("review_marks")
      .select(
        "id, created_at, part:parts(id, title, kind, lesson:lessons(title)), course:courses(id, slug, title)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    countDueItems(supabase, user.id),
  ]);

  const items = (marks ?? []).filter((m) => m.part && m.course);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <BackLink href="/painel" label="Voltar ao painel" />
        <h1 className="text-2xl font-semibold text-fg-primary">
          Para revisar
        </h1>
        <p className="text-sm text-fg-secondary">
          Revisão espaçada automática + suas marcações manuais.
        </p>
      </div>

      {/* SRS — revisão espaçada automática */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Revisão espaçada
        </h2>
        <Card padded className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-fg-primary">
              {dueCount === 0
                ? "Nenhum item pronto agora."
                : dueCount === 1
                  ? "1 item pronto para revisar"
                  : `${dueCount} itens prontos para revisar`}
            </span>
            <span className="text-xs text-fg-tertiary">
              Geramos a fila a partir dos exercícios que você errou e do
              vocabulário das partes concluídas.
            </span>
          </div>
          {dueCount > 0 && (
            <Link href="/painel/revisar/sessao">
              <Button size="sm">Começar revisão</Button>
            </Link>
          )}
        </Card>
      </section>

      {/* Marcações manuais */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Marcações manuais
        </h2>
      {items.length === 0 ? (
        <Card padded>
          <EmptyState
            illustration={<InboxIllustration className="h-20 w-20" />}
            title="Sem marcações ainda"
            description="Dentro de uma parte, toque no marcador para guardá-la aqui e revisitar depois."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((mark, i) => {
            const part = mark.part!;
            const course = mark.course!;
            const lessonTitle = part.lesson?.title;
            return (
              <li
                key={mark.id}
                className="animate-fade-slide-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Card
                  padded
                  className="flex items-center justify-between gap-4"
                >
                  <Link
                    href={`/partes/${part.id}`}
                    className="flex min-w-0 flex-1 flex-col"
                  >
                    <span className="truncate font-medium text-fg-primary">
                      {part.title}
                    </span>
                    <span className="truncate text-xs text-fg-tertiary">
                      {course.title}
                      {lessonTitle ? ` · ${lessonTitle}` : ""}
                    </span>
                  </Link>
                  <form action={toggleReviewMark}>
                    <input type="hidden" name="part_id" value={part.id} />
                    <input type="hidden" name="course_id" value={course.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label="Remover marcação"
                      title="Remover marcação"
                    >
                      <BookmarkIcon filled className="h-4 w-4 text-warning" />
                    </Button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      </section>
    </main>
  );
}
