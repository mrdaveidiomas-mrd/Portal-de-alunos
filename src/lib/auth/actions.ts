"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AuthState } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword(
    parsed.data,
  );

  if (error) {
    // Mensagem genérica de propósito — não revelar se o e-mail existe.
    return { error: "E-mail ou senha inválidos.", notice: null };
  }

  revalidatePath("/", "layout");
  // Por role: admin vai direto pro próprio painel, professor pro dele,
  // aluno para /painel. Ver-como-X são acessíveis pelas configurações.
  //
  // Usamos o admin client (service_role) para ler o role aqui —
  // signInWithPassword acabou de setar a sessão, mas o auth.uid() no
  // mesmo request pode ainda não ter sido propagado para o PostgREST,
  // e a RLS de profiles (id = auth.uid()) faria a query silenciosamente
  // retornar null. O user.id já foi validado pelo signInData, então
  // ler com service_role é seguro.
  const userId = signInData.user?.id;
  let target = "/painel";
  if (userId) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "admin") target = "/admin";
    else if (profile?.role === "teacher") target = "/professor";
  }
  redirect(target);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) {
    return { error: error.message, notice: null };
  }

  // Se a confirmação de e-mail estiver ligada, não há sessão ainda.
  if (!data.session) {
    return {
      error: null,
      notice:
        "Cadastro criado! Confirme seu e-mail para ativar a conta e entrar.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/painel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
