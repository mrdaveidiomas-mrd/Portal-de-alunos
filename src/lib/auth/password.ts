"use server";

import { z } from "zod";

import type { AuthState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const requestResetSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "A nova senha precisa ter ao menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

// Envia o e-mail com link para redefinir a senha. Resposta sempre genérica
// (sucesso) para não permitir enumerar quais e-mails existem.
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = requestResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${baseUrl}/auth/callback?next=/redefinir-senha`,
  });

  return {
    error: null,
    notice:
      "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira sua caixa de entrada.",
  };
}

// Atualiza a senha do usuário logado. Usado tanto na troca consciente
// (/painel/senha) quanto após o link de reset (/redefinir-senha).
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Sessão expirada. Solicite um novo link de redefinição.",
      notice: null,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: `Não foi possível atualizar a senha: ${error.message}`, notice: null };
  }

  return { error: null, notice: "Senha atualizada com sucesso." };
}
