// Retry curto para falhas TRANSITÓRIAS em chamadas ao Supabase (504/timeout/
// rede). No plano free, o gateway às vezes estoura o tempo em picos e devolve
// 504 — um único retry converte essa "queda" visível num soft-retry silencioso.
//
// Só refaz sinais transitórios: NUNCA erros de lógica/RLS/validação (esses não
// melhoram com retry). Máximo `retries` tentativas extras, com backoff curto.

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

export async function withTransientRetry<T>(
  fn: () => Promise<T>,
  { retries = 1, delayMs = 300 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransient(error)) throw error;
      // Backoff linear leve: 300ms, 600ms, ...
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

// Heurística de "transitório": status HTTP de gateway/sobrecarga, ou mensagens
// de timeout/rede. Conservadora — na dúvida, NÃO refaz.
function isTransient(error: unknown): boolean {
  const status =
    (error as { status?: number })?.status ??
    (error as { statusCode?: number })?.statusCode;
  if (status && [408, 425, 429, 500, 502, 503, 504].includes(status)) return true;

  const message = String((error as { message?: string })?.message ?? "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("gateway") ||
    message.includes("upstream")
  );
}
