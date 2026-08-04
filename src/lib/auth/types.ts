// Tipos e estado inicial das Server Actions de auth. Ficam fora de actions.ts
// porque um módulo "use server" só pode exportar funções async.

export interface AuthState {
  error: string | null;
  notice: string | null;
}

export const initialAuthState: AuthState = { error: null, notice: null };
