// Estado das Server Actions de matrícula (fora de actions.ts porque um módulo
// "use server" só pode exportar funções async).

export interface EnrollState {
  error: string | null;
  notice: string | null;
}

export const initialEnrollState: EnrollState = { error: null, notice: null };

// Estado de criação de usuário (aluno ou professor — o role é passado
// ao chamar a Server Action). Mantém o nome legado CreateStudentState
// para não quebrar imports antigos enquanto eles existem.
export interface CreateUserState {
  error: string | null;
  notice: string | null;
  // Credenciais exibidas só após o sucesso, para o admin entregar.
  credentials: { email: string; password: string } | null;
}

export const initialCreateUserState: CreateUserState = {
  error: null,
  notice: null,
  credentials: null,
};

// Aliases preservados para compat com imports anteriores.
export type CreateStudentState = CreateUserState;
export const initialCreateStudentState = initialCreateUserState;
