import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CursoLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      {Array.from({ length: 2 }).map((_, m) => (
        <section key={m} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, l) => (
              <Card key={l} padded className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full" />
                <ul className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, p) => (
                    <li key={p} className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-16" />
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
