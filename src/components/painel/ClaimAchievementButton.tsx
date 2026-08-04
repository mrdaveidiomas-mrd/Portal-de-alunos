"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { claimAchievement } from "@/lib/achievements/actions";
import { toast } from "@/lib/toast/store";

// Botão pequeno "Coletar recompensa" — dispara claimAchievement e mostra
// toast de sucesso/erro. Server Action refresh-a a página via
// revalidatePath, então o card vira para o estado "claimed" sozinho.
export function ClaimAchievementButton({
  achievementId,
  xpReward,
  size = "sm",
}: {
  achievementId: string;
  xpReward: number;
  size?: "sm" | "md" | "lg";
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    startTransition(async () => {
      const res = await claimAchievement(achievementId);
      if (res.ok) {
        toast.success({
          title: "Recompensa coletada!",
          description: res.xpAwarded > 0 ? `+${res.xpAwarded} XP` : undefined,
        });
      } else if (res.error) {
        toast.danger({ title: res.error });
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={handleClick}
      loading={pending}
      className="shrink-0"
    >
      Coletar +{xpReward} XP
    </Button>
  );
}
