import Link from "next/link";

import { KeyIcon } from "@/components/icons/KeyIcon";
import { SignOutButton } from "@/components/painel/SignOutButton";
import { ThemeSwitch } from "@/components/painel/ThemeSwitch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Seções compartilhadas entre as configurações de aluno, professor e
// admin. Mantemos como componentes granulares para que cada papel
// possa intercalar suas seções específicas (ex: vozes do TTS no
// aluno, "Ver como X" no admin/professor) na ordem que faz sentido.

export function ThemeSection() {
  return (
    <Card padded className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-fg-primary">Tema</h2>
      <p className="text-sm text-fg-secondary">
        Ajuste o tema conforme sua preferência.
      </p>
      <ThemeSwitch />
    </Card>
  );
}

// O passwordFromKey vira ?from=<key> e a página de senha usa isso
// para escolher o destino do botão "Voltar".
export function PasswordSection({
  passwordFromKey,
}: {
  passwordFromKey?: "admin" | "professor";
}) {
  const href = passwordFromKey
    ? `/painel/senha?from=${passwordFromKey}`
    : "/painel/senha";
  return (
    <Card padded className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-fg-primary">Senha</h2>
      <p className="text-sm text-fg-secondary">
        Atualize a senha de acesso à sua conta.
      </p>
      <Link href={href} className="block">
        <Button type="button" variant="secondary" className="w-full">
          Trocar senha
        </Button>
      </Link>
    </Card>
  );
}

export function SignOutSection() {
  return (
    <Card padded className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-fg-primary">Sair</h2>
      <p className="text-sm text-fg-secondary">
        Encerre sua sessão neste dispositivo.
      </p>
      <SignOutButton />
    </Card>
  );
}
