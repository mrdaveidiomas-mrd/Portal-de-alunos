import type { TableData } from "@/lib/blocks/schemas";

// Tabela de texto simples. A primeira linha do editor vira o cabeçalho
// (<th>), o resto é o corpo. Tabelas largas rolam DENTRO do próprio
// container (overflow-x-auto) — a página nunca rola na horizontal, o que
// quebraria o layout no mobile.
export function TableBlock({ data }: { data: TableData }) {
  const cols = data.header.length;

  return (
    <div className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {data.header.map((cell, i) => (
                <th
                  key={i}
                  scope="col"
                  className="border border-border-primary bg-bg-tertiary px-3 py-2 text-left font-semibold text-fg-primary"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, r) => (
              <tr key={r}>
                {/* Normaliza o número de células ao do cabeçalho — protege
                    contra linhas curtas/longas em conteúdo antigo. */}
                {Array.from({ length: cols }).map((_, c) => (
                  <td
                    key={c}
                    className="border border-border-primary px-3 py-2 align-top text-fg-primary"
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
