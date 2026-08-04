import {
  PasswordSection,
  SignOutSection,
  ThemeSection,
} from "@/components/shared/SettingsSections";
import { requireTeacher } from "@/lib/professor/guard";

// Configurações do professor: mesmas seções comuns (Tema · Senha · Sair).
export default async function ProfessorConfiguracoesPage() {
  await requireTeacher();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">Configurações</h1>
        <p className="text-sm text-fg-secondary">
          Ajuste a aparência, sua senha e gerencie a sessão.
        </p>
      </div>

      <ThemeSection />
      <PasswordSection passwordFromKey="professor" />
      <SignOutSection />
    </div>
  );
}
