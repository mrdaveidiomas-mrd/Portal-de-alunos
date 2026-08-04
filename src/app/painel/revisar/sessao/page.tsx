import { redirect } from "next/navigation";

import {
  ReviewSession,
  type SpeechConfig,
} from "@/components/painel/ReviewSession";
import { TargetIllustration } from "@/components/illustrations/TargetIllustration";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserPreferences } from "@/lib/preferences/queries";
import { listDueItems } from "@/lib/srs/queries";
import { createClient } from "@/lib/supabase/server";
import { languageCodeForVoice } from "@/lib/tts/voices";

export default async function SessaoRevisaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [items, prefs] = await Promise.all([
    listDueItems(supabase, user.id, 20),
    getUserPreferences(supabase, user.id),
  ]);

  // Config de fala para a revisão de speaking: por idioma, o locale do
  // reconhecedor (BCP-47, honrando o sotaque preferido) + a voz do TTS
  // para o botão "Ouvir".
  const speech: SpeechConfig = {
    en: {
      recognizerLang: languageCodeForVoice(prefs.ttsVoiceEn),
      ttsVoice: prefs.ttsVoiceEn,
    },
    es: {
      recognizerLang: languageCodeForVoice(prefs.ttsVoiceEs),
      ttsVoice: prefs.ttsVoiceEs,
    },
    rate: prefs.ttsRate,
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <BackLink href="/painel/revisar" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">
          Sessão de revisão
        </h1>
      </div>

      {items.length === 0 ? (
        <Card padded>
          <EmptyState
            illustration={<TargetIllustration className="h-20 w-20" />}
            title="Nada para revisar agora"
            description="Quando você errar um exercício ou concluir uma parte com vocabulário, novos itens aparecem aqui na hora certa."
          />
        </Card>
      ) : (
        <ReviewSession items={items} speech={speech} />
      )}
    </main>
  );
}
