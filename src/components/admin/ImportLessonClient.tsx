"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { commitImportedDraft } from "@/lib/admin/import";
import { draftLesson, type DraftLesson } from "@/lib/blocks/schemas";
import { createClient } from "@/lib/supabase/browser";

type Stage = "pick" | "loading" | "preview" | "error";

// Cada etapa tem um peso relativo (aproximado) na duração total para a
// barra de progresso parecer realista. Não medimos a Claude API real
// (não streama progresso), apenas damos passos discretos + uma animação
// dentro da etapa "claude" para a espera não parecer travada.
type LoadingStep =
  | "reading-pdf"
  | "extracting-text"
  | "claude"
  | "validating";

const STEP_LABELS: Record<LoadingStep, string> = {
  "reading-pdf": "Lendo o PDF",
  "extracting-text": "Extraindo o texto",
  claude: "Estruturando com a Claude API",
  validating: "Validando o resultado",
};
const STEP_PROGRESS: Record<LoadingStep, number> = {
  "reading-pdf": 15,
  "extracting-text": 35,
  claude: 75,
  validating: 95,
};

interface Props {
  lessonId: string;
  courseLanguage: "en" | "es";
  existingPartsCount: number;
}

// Importação de PDF (admin):
// 1) Admin escolhe um PDF; extraímos texto via pdfjs no browser.
// 2) Mandamos para a Edge Function import_lesson; ela retorna o draft.
// 3) Resumo (partes/blocos) + confirmação. Ajustes finos vão para a tela
//    normal de edição da lição depois de importado.
export function ImportLessonClient({
  lessonId,
  courseLanguage,
  existingPartsCount,
}: Props) {
  const [stage, setStage] = useState<Stage>("pick");
  const [draft, setDraft] = useState<DraftLesson | null>(null);
  const [draftJson, setDraftJson] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [step, setStep] = useState<LoadingStep>("reading-pdf");

  async function handlePdf(file: File) {
    setStage("loading");
    setError("");
    setPdfName(file.name);
    setStep("reading-pdf");

    try {
      setStep("extracting-text");
      const text = await extractPdfText(file);
      if (!text || text.length < 200) {
        throw new Error("Não foi possível extrair texto do PDF (vazio ou ilegível).");
      }

      setStep("claude");
      const supabase = createClient();
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "import_lesson",
        { body: { text, languageCode: courseLanguage } },
      );
      if (invokeErr || !data?.draft) {
        throw new Error(invokeErr?.message ?? "Falha ao gerar o draft.");
      }

      setStep("validating");
      const parsed = draftLesson.safeParse(data.draft);
      if (!parsed.success) {
        throw new Error(
          "O modelo retornou um JSON fora do esquema. Veja o draft cru e edite manualmente antes de confirmar.",
        );
      }

      setDraft(parsed.data);
      setDraftJson(JSON.stringify(parsed.data, null, 2));
      setStage("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
      setStage("error");
    }
  }

  if (stage === "loading") {
    return <ImportProgress step={step} pdfName={pdfName} />;
  }

  if (stage === "pick" || stage === "error") {
    return (
      <div className="flex flex-col gap-4">
        <Card padded className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-fg-primary">
            Selecionar PDF
          </h2>
          <p className="text-sm text-fg-secondary">
            O texto é extraído no seu navegador (o PDF não é enviado ao servidor).
            A estruturação em partes e blocos é feita por uma chamada à Claude API.
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdf(file);
            }}
            className="text-sm text-fg-primary"
          />
          {existingPartsCount > 0 && (
            <p className="text-xs text-warning">
              Atenção: esta lição já tem {existingPartsCount}{" "}
              {existingPartsCount === 1 ? "parte" : "partes"}. Ao confirmar a
              importação, elas serão substituídas pelo conteúdo do PDF.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </Card>
      </div>
    );
  }

  // preview
  return (
    <div className="flex flex-col gap-4">
      <Card padded className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">Resumo</h2>
        <p className="text-sm text-fg-secondary">
          {draft?.parts.length}{" "}
          {draft?.parts.length === 1 ? "parte" : "partes"} estruturadas a partir
          de <strong>{pdfName}</strong>.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-fg-secondary">
          {draft?.parts.map((p, i) => (
            <li key={i}>
              <span className="text-fg-primary">{p.title}</span>{" "}
              {p.kind === "golden" && (
                <span className="text-xs text-warning">(dourada)</span>
              )}{" "}
              · {p.blocks.length}{" "}
              {p.blocks.length === 1 ? "bloco" : "blocos"}
            </li>
          ))}
        </ul>
      </Card>

      <form action={commitImportedDraft} className="flex flex-col gap-3">
        <input type="hidden" name="lesson_id" value={lessonId} />
        <input type="hidden" name="draft" value={draftJson} />
        <input
          type="text"
          name="lesson_title"
          defaultValue={draft?.lesson_title ?? ""}
          placeholder="Título da lição (opcional — atualiza se preenchido)"
          className="h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary"
        />
        <p className="text-xs text-fg-tertiary">
          Depois de importar você pode ajustar cada bloco na tela da lição.
        </p>
        <Button
          type="submit"
          variant="primary"
          onClick={(e) => {
            if (existingPartsCount > 0) {
              const ok = confirm(
                `Substituir as ${existingPartsCount} parte(s) atuais pelo conteúdo importado?`,
              );
              if (!ok) e.preventDefault();
            }
          }}
          className="self-start"
        >
          Confirmar e importar
        </Button>
      </form>
    </div>
  );
}

// Barra de progresso isolada para que o "creep" (tick lento de +1% por
// segundo durante a etapa Claude) viva em useState sem precisar resetar
// num effect. O pai re-monta este componente com `key={step}`.
function ProgressBar({ step }: { step: LoadingStep }) {
  const base = STEP_PROGRESS[step];
  const [creep, setCreep] = useState(0);

  useEffect(() => {
    if (step !== "claude") return;
    const id = setInterval(() => {
      setCreep((c) => Math.min(15, c + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const progress = Math.min(100, base + (step === "claude" ? creep : 0));

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Progresso da importação"
        className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
      >
        <div
          className="h-full rounded-full bg-fg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-right text-xs text-fg-tertiary">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

// --- Progress UI durante a importação ---
//
// Mostra os 4 passos (lendo PDF / extraindo texto / chamando Claude /
// validando) com uma barra que avança até a porcentagem do passo atual.
// Dentro da etapa "claude" (a mais demorada), um pequeno tick adiciona
// 1% a cada segundo até bater 90%, para o aluno ter feedback contínuo
// e a espera não parecer travada (não medimos progresso real da Claude API).
function ImportProgress({
  step,
  pdfName,
}: {
  step: LoadingStep;
  pdfName: string;
}) {
  const stepOrder: LoadingStep[] = [
    "reading-pdf",
    "extracting-text",
    "claude",
    "validating",
  ];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <Card padded className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-fg-primary">
          Importando {pdfName ? `"${pdfName}"` : "o PDF"}
        </h2>
        <p className="text-sm text-fg-secondary">
          Isso geralmente leva entre 10 e 30 segundos. Não feche a janela.
        </p>
      </div>

      {/* Barra de progresso. Re-mounta a cada mudança de step para resetar
          o "creep" sem precisar de setState dentro de effect. */}
      <ProgressBar key={step} step={step} />


      {/* Lista de etapas */}
      <ul className="flex flex-col gap-2">
        {stepOrder.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li
              key={s}
              className="flex items-center gap-2 text-sm"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={
                  done
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-success text-fg-inverse"
                    : active
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-fg-primary text-fg-inverse"
                      : "inline-flex h-5 w-5 items-center justify-center rounded-full border border-border-primary text-fg-tertiary"
                }
              >
                {done ? (
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : active ? (
                  <svg
                    className="h-3 w-3 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-80"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </span>
              <span
                className={
                  done
                    ? "text-fg-secondary"
                    : active
                      ? "font-medium text-fg-primary"
                      : "text-fg-tertiary"
                }
              >
                {STEP_LABELS[s]}
                {active && "…"}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// --- Extração de texto do PDF no browser via pdfjs-dist ---
async function extractPdfText(file: File): Promise<string> {
  // Importação dinâmica — só roda no client, fora do bundle inicial.
  const pdfjs = await import("pdfjs-dist");
  // Worker servido a partir de /public (copiado de node_modules).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n\n");
}
