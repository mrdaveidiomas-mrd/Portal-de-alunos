import { redirect } from "next/navigation";

import { PreferencesForm } from "@/components/painel/PreferencesForm";
import { BackLink } from "@/components/shared/BackLink";
import {
  PasswordSection,
  SignOutSection,
  ThemeSection,
} from "@/components/shared/SettingsSections";
import { getUserPreferences } from "@/lib/preferences/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Idiomas das matrículas ativas → quais seções de voz mostrar.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course:courses(language)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const enrolledLanguagesSet = new Set<"en" | "es">();
  for (const row of enrollments ?? []) {
    const lang = row.course?.language;
    if (lang === "en" || lang === "es") enrolledLanguagesSet.add(lang);
  }
  const enrolledLanguages = Array.from(enrolledLanguagesSet);

  const prefs = await getUserPreferences(supabase, user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <BackLink href="/painel" label="Voltar ao painel" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">Configurações</h1>
        <p className="text-sm text-fg-secondary">
          Ajuste a aparência, a voz dos áudios, sua senha e gerencie a sessão.
        </p>
      </div>

      <ThemeSection />
      <PreferencesForm
        initialVoiceEn={prefs.ttsVoiceEn}
        initialVoiceEs={prefs.ttsVoiceEs}
        initialRate={prefs.ttsRate}
        availableLanguages={enrolledLanguages}
      />
      <PasswordSection />
      <SignOutSection />
    </main>
  );
}
