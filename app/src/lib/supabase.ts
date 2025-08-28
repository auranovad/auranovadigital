// app/src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Toma primero variables de Vite (navegador) y, si no existen, usa process.env (CI/tests)
const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;

const url: string | undefined =
  viteEnv?.VITE_SUPABASE_URL ??
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : undefined);

const anonKey: string | undefined =
  viteEnv?.VITE_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

if (!url) throw new Error("VITE_SUPABASE_URL is required");
if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY is required");

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: true },
});
