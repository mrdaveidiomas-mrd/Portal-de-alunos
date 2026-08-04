import { cn } from "@/lib/utils/cn";

// Estado vazio amigável: ilustração + título + descrição opcional + ação
// opcional. Ilustrações monocromáticas em currentColor (tema-friendly).
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 py-8 text-center",
        className,
      )}
    >
      {illustration && (
        <div className="text-fg-tertiary opacity-70">{illustration}</div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-fg-primary">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-fg-secondary">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
