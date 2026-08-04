// Bootstrap do professor de demonstração.
// Cria (ou reaproveita) professor@demo.com já confirmado, define role=teacher
// e vincula a ele todos os alunos já cadastrados (via teacher_students).
// Idempotente. Rode com: pnpm seed:professor

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PROFESSOR_EMAIL = "professor@demo.com";
const PROFESSOR_PASSWORD = "professor1234";

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) throw listErr;

let user = listed.users.find((u) => u.email === PROFESSOR_EMAIL);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: PROFESSOR_EMAIL,
    password: PROFESSOR_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Professor Demo" },
  });
  if (error) throw error;
  user = data.user;
  console.log(`Conta criada: ${PROFESSOR_EMAIL}`);
} else {
  console.log(`Conta já existe: ${PROFESSOR_EMAIL}`);
}

// role=teacher (trigger permite via service_role após a migration de junho).
const { error: roleErr } = await admin
  .from("profiles")
  .update({ role: "teacher" })
  .eq("id", user.id);
if (roleErr) throw roleErr;

// Vincula todos os alunos já cadastrados a este professor (idempotente
// via ON CONFLICT DO NOTHING — a PK é teacher_id + student_id).
const { data: students } = await admin
  .from("profiles")
  .select("id")
  .eq("role", "student");

if (students && students.length > 0) {
  const rows = students.map((s) => ({
    teacher_id: user.id,
    student_id: s.id,
  }));
  const { error: linkErr } = await admin
    .from("teacher_students")
    .upsert(rows, { onConflict: "teacher_id,student_id" });
  if (linkErr) throw linkErr;
  console.log(`Vinculado a ${students.length} aluno(s).`);
} else {
  console.log("Nenhum aluno cadastrado para vincular ainda.");
}

console.log(`Login professor: ${PROFESSOR_EMAIL} / ${PROFESSOR_PASSWORD}`);
