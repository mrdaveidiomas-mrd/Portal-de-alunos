import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Edge Functions rodam no Deno (imports jsr:), fora do lint do app Next.
    "supabase/functions/**",
    // Assets servidos como static (ex: worker minificado do pdfjs).
    "public/**",
  ]),
]);

export default eslintConfig;
