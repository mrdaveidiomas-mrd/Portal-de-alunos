import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Skeleton do /painel: header + KPIs + 2 cards de atalho + cards de curso.
// Mantém o mesmo grid/layout da página real para evitar salto na hidratação.
export default function PainelLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </header>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>

      <section className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded className="flex flex-col gap-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} padded className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} padded className="flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </Card>
        ))}
      </section>
    </main>
  );
}
