// Bootstrap do administrador de demonstração.
// Cria (ou reaproveita) admin@demo.com já confirmado e define role=admin.
// Cloud-only via service_role. Idempotente. Rode com: pnpm seed:admin

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
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = "admin@demo.com";
const ADMIN_PASSWORD = "admin1234";

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) throw listErr;

let user = listed.users.find((u) => u.email === ADMIN_EMAIL);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Admin Demo" },
  });
  if (error) throw error;
  user = data.user;
  console.log(`Conta criada: ${ADMIN_EMAIL}`);
} else {
  console.log(`Conta já existe: ${ADMIN_EMAIL}`);
}

// Promove a admin (o trigger permite alteração via service_role).
const { error: updErr } = await admin
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", user.id);
if (updErr) throw updErr;

const { data: profile } = await admin
  .from("profiles")
  .select("email, role")
  .eq("id", user.id)
  .single();

console.log("Perfil:", profile);
console.log(`Login admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
