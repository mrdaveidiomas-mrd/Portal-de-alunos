import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StreakLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <Skeleton className="h-6 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <section className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded className="flex flex-col gap-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </section>
      <Card padded className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </main>
  );
}
