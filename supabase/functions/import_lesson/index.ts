// Edge Function: import_lesson
// Recebe o TEXTO já extraído do PDF (no browser, via pdfjs) e chama a Claude
// API para estruturar em partes + blocos no formato do schema. Cache por hash
// do texto + modelo no Storage (bucket lesson-drafts), igual ao TTS.
//
// Auth: verify_jwt = true (e checagem extra de role admin). Anthropic via
// secret ANTHROPIC_API_KEY.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "lesson-drafts";
const MAX_TEXT = 60_000;
const MODEL = "claude-sonnet-4-5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SYSTEM_PROMPT = `Você converte materiais de cursos de idiomas em conteúdo estruturado de um portal de alunos.

Você recebe o texto bruto extraído de um PDF de uma lição de inglês ou espanhol (geralmente seguindo seções: Opening text, Vocabulary, Lesson topic, Grammar, Pronunciation, Dialogue, Exercises).

Sua tarefa é devolver um JSON com a estrutura abaixo. Não inclua texto explicativo fora do JSON.

Esquema de resposta:
{
  "lesson_title": "string curto",
  "parts": [
    {
      "title": "string curto, ex.: 'Abertura', 'Vocabulary', 'Grammar', 'Dialogue'",
      "kind": "regular" | "golden",
      "blocks": [Block, ...]
    },
    ...
  ]
}

Tipos de bloco permitidos (use exatamente esses 'type'):

1) rich_text — explicação ou texto longo.
{ "type": "rich_text", "data": { "text": "..." } }

2) vocabulary — lista de termos.
{ "type": "vocabulary", "data": { "items": [{ "term": "...", "translation": "...", "example": "opcional" }, ...] } }

3) reading_tts — texto para o aluno ouvir.
{ "type": "reading_tts", "data": { "title": "opcional", "text": "..." } }

4) dialogue_tts — diálogo entre personagens nomeados.
{ "type": "dialogue_tts", "data": { "lines": [{ "speaker": "Nome", "text": "..." }, ...] } }

5) pronunciation — lista de frases curtas para o aluno OUVIR e repetir.
{ "type": "pronunciation", "data": { "title": "opcional", "items": ["frase 1", "frase 2", ...] } }

6) speaking — lista de frases curtas para o aluno FALAR (o navegador transcreve via Web Speech API e compara com a frase).
{ "type": "speaking", "data": { "title": "opcional", "items": ["frase 1", "frase 2", ...] } }

7) multiple_choice — exercício com alternativas.
{ "type": "multiple_choice", "data": { "question": "...", "options": ["a","b","c"] }, "solution": { "answerIndex": 0 } }

8) fill_blank — lacuna a preencher.
{ "type": "fill_blank", "data": { "prompt": "Texto com ___ onde vai a resposta" }, "solution": { "answer": "resposta canônica", "alternatives": ["variação 1", "variação 2"] } }

9) translation — aluno traduz uma frase.
{ "type": "translation", "data": { "instruction": "Traduza para o inglês:", "source": "frase original em português" }, "solution": { "answer": "tradução canônica", "alternatives": ["variação 1"] } }

10) reorder_words — aluno reordena palavras embaralhadas. 'tokens' DEVE estar na ORDEM CORRETA (o sistema embaralha ao exibir).
{ "type": "reorder_words", "data": { "instruction": "Reordene para formar a frase:", "tokens": ["I", "am", "studying", "english"] } }

11) error_correction — aluno corrige uma frase com erro.
{ "type": "error_correction", "data": { "instruction": "Corrija a frase:", "sentence": "She go to school every day." }, "solution": { "answer": "She goes to school every day.", "alternatives": [] } }

Regras importantes:
- NÃO inclua emojis ou símbolos decorativos (a voz lê em voz alta).
- Setas '→' viram ', ' (vírgula).
- A última parte da lição deve ter "kind": "golden" e ser uma revisão curta (2-3 exercícios).
- Use 'reading_tts' para textos contínuos curtos (1-3 parágrafos), 'rich_text' para explicações gramaticais.
- 'pronunciation' é só OUVIR e repetir; use 'speaking' quando quiser que o aluno FALE e o sistema avalie (forem exercícios de pronúncia ativos).
- Em 'multiple_choice', 'answerIndex' é zero-based.
- Em 'fill_blank', use '___' no prompt para marcar a lacuna; a resposta canônica em 'answer'.
- Em 'translation' e 'error_correction', preencha 'alternatives' com variações naturais aceitas.
- Em 'reorder_words', 'tokens' é a frase já na ORDEM CORRETA — o sistema embaralha sozinho.
- Misture os tipos de exercício na parte de exercises: prefira diversidade (não use só fill_blank).
- Mantenha o conteúdo em inglês quando for material em inglês; instruções/títulos podem ficar em português.
- Responda APENAS com o JSON, sem markdown, sem prefixo.`;

interface ImportRequest {
  text?: unknown;
  languageCode?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Verifica admin pelo JWT (verify_jwt já garante usuário; checamos role).
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: "Não autenticado" }, 401);
  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return json({ error: "Acesso restrito ao admin" }, 403);
  }

  let body: ImportRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const lang = (typeof body.languageCode === "string" ? body.languageCode : "en")
    .slice(0, 2)
    .toLowerCase();
  if (!text) return json({ error: "Texto vazio" }, 400);
  if (text.length > MAX_TEXT) return json({ error: "Texto muito longo" }, 400);

  // Cache
  const cacheKey = await sha256Hex(`${MODEL}|${lang}|${text}`);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const path = `${cacheKey}.json`;
  const cached = await admin.storage.from(BUCKET).download(path);
  if (cached.data) {
    const cachedText = await cached.data.text();
    return json({ draft: JSON.parse(cachedText), cached: true });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json(
      { error: "ANTHROPIC_API_KEY não configurada nos secrets da Edge Function." },
      503,
    );
  }

  // Claude API
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Idioma do conteúdo: ${lang}. Texto do PDF a estruturar:\n\n${text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    return json({ error: "Falha na Claude API", detail }, 502);
  }
  const payload = await res.json();
  const raw = (payload.content?.[0]?.text ?? "").trim();
  if (!raw) return json({ error: "Resposta vazia do modelo" }, 502);

  // Tenta extrair só o JSON (defesa contra cercas de código).
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    return json({ error: "Resposta não é JSON", sample: raw.slice(0, 200) }, 502);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return json({ error: "JSON inválido", sample: raw.slice(0, 200) }, 502);
  }

  // Salva cache (best-effort, não bloqueia resposta em caso de erro).
  await admin.storage.from(BUCKET).upload(path, JSON.stringify(parsed), {
    contentType: "application/json",
    upsert: true,
  });

  return json({ draft: parsed, cached: false });
});
