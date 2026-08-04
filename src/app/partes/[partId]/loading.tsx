import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ParteLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-1.5 w-full" />

        <Card padded className="flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-10 w-32" />
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </main>
  );
}
