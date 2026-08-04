"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Logo } from "@/components/shared/Logo";
import { signIn } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";

// Login redesenhado para perder a "cara de sistema".
//
// Layout:
//   Desktop (md+): split 50/50.
//     - Esquerda: hero visual. Tenta carregar /login/hero.jpg; se não
//       existir (ou falhar), cai em um fallback com as cores da marca
//       + logo + tagline (gracioso, nunca quebrado).
//     - Direita: form de login, campos maiores, copy acolhedora.
//   Mobile: só o form (esquerda escondida), com logo da escola no topo.
//
// Tipografia/cores do form respeitam o tema (claro/escuro). A hero
// esquerda é sempre na cor da marca pra ter personalidade independente.

const labelCls = "text-sm font-semibold text-fg-primary";
const inputWrapperCls = "relative flex items-center";
// Campos maiores e mais arredondados que o resto do app — mais
// "acolhedor", menos "formulário corporativo".
const inputCls =
  "h-12 w-full rounded-lg border border-border-primary bg-bg-secondary pl-11 pr-4 text-sm text-fg-primary outline-none transition-all placeholder:text-fg-tertiary focus:border-primary-brand focus:shadow-[0_0_0_3px_rgba(3,45,111,0.12)] disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-fg-tertiary";
const inputIconCls =
  "pointer-events-none absolute left-4 text-fg-tertiary";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    signIn,
    initialAuthState,
  );
  const [showPassword, setShowPassword] = useState(false);
  // Hero image: se /login/hero.jpg não existir ou falhar, escondemos o
  // <img> e o fallback (gradiente + logo + tagline) fica visível.
  const [heroFailed, setHeroFailed] = useState(false);

  const year = new Date().getFullYear();

  return (
    <main className="flex min-h-dvh w-full bg-bg-primary">
      {/* ============= ESQUERDA (desktop) — hero ============= */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden md:flex md:w-1/2 lg:w-3/5"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-700) 0%, #051f50 55%, #0a0a1a 100%)",
        }}
      >
        {/* Hero image (opcional). Se /login/hero.jpg estiver presente,
            cobre o gradient. Em qualquer falha, escondemos e o fallback
            estiloso fica visível. */}
        {!heroFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/login/hero.jpg"
            alt=""
            onError={() => setHeroFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        )}

        {/* Scrim de legibilidade — só quando há imagem real. */}
        {!heroFailed && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-black/10" />
        )}

        {/* Formas flutuantes — só no fallback (sem imagem). Dão
            respiração à tela e remetem ao sistema irmão. */}
        {heroFailed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span
              className="animate-login-float absolute h-[520px] w-[520px] rounded-full opacity-[0.14]"
              style={{
                background:
                  "radial-gradient(circle, var(--color-primary-light), transparent 70%)",
                top: "-160px",
                right: "-120px",
              }}
            />
            <span
              className="animate-login-float-reverse absolute h-[400px] w-[400px] rounded-full opacity-[0.14]"
              style={{
                background:
                  "radial-gradient(circle, var(--color-secondary), transparent 70%)",
                bottom: "-120px",
                left: "-80px",
              }}
            />
            <span
              className="animate-login-float-slow absolute h-[280px] w-[280px] rounded-full opacity-[0.12]"
              style={{
                background:
                  "radial-gradient(circle, #4a90e2, transparent 70%)",
                top: "45%",
                left: "15%",
              }}
            />
          </div>
        )}

        {/* Conteúdo overlay — logo + tagline. Sempre visível, sobre a
            imagem (com scrim) ou sobre o gradient/formas. */}
        <div className="relative z-10 m-auto flex max-w-md flex-col items-center gap-6 px-10 text-center text-white">
          <Logo
            className="h-24 w-24 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.30)]"
            priority
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold leading-tight">
              Mr. Dave Idiomas
            </h1>
            <p className="text-lg leading-snug text-white/85">
              Sua plataforma integrada de estudo de idiomas.
            </p>
          </div>
        </div>
      </aside>

      {/* ============= DIREITA — form ============= */}
      <section
        aria-label="Formulário de login"
        className="flex min-h-dvh w-full flex-col md:w-1/2 lg:w-2/5"
      >
        <div className="animate-login-slide-up m-auto flex w-full max-w-md flex-col gap-8 px-6 py-12">
          {/* Header: no mobile mostra a logo grande; no desktop só o
              título (a logo já está no painel esquerdo). */}
          <header className="flex flex-col items-center gap-4 md:items-start">
            <Logo className="h-16 w-16 rounded-2xl md:hidden" priority />
            <div className="flex flex-col gap-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-fg-primary">
                Bem-vindo de volta
              </h2>
              <p className="text-sm text-fg-secondary">
                Entre para continuar sua jornada.
              </p>
            </div>
          </header>

          <form action={formAction} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className={labelCls}>
                E-mail
              </label>
              <div className={inputWrapperCls}>
                <EnvelopeIcon className={`${inputIconCls} h-5 w-5`} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className={labelCls}>
                Senha
              </label>
              <div className={inputWrapperCls}>
                <LockIcon className={`${inputIconCls} h-5 w-5`} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="absolute right-3 rounded p-1 text-fg-tertiary transition-colors hover:text-fg-primary"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label className="inline-flex cursor-pointer select-none items-center gap-2 text-fg-secondary">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-[18px] w-[18px] cursor-pointer rounded border border-border-primary accent-primary-brand"
                />
                Lembrar de mim
              </label>
              <Link
                href="/recuperar-senha"
                className="font-medium text-primary-brand transition-colors hover:text-primary-brand-hover hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-brand px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,45,111,0.30)] transition-all hover:-translate-y-px hover:bg-primary-brand-hover hover:shadow-[0_6px_20px_rgba(3,45,111,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Entrar
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>

            {state.error && (
              <p
                role="alert"
                className="rounded-md border border-danger/30 bg-danger-surface px-3.5 py-2.5 text-sm text-danger"
              >
                {state.error}
              </p>
            )}
          </form>

          <footer className="text-center text-xs text-fg-tertiary md:text-left">
            © {year} Mr. Dave Idiomas — Todos os direitos reservados
          </footer>
        </div>
      </section>
    </main>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
