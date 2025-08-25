// app/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Lee primero variables de Vite (navegador) y si no existen, cae a process.env (CI/test/node)
const url =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);

const anon =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

if (!url) throw new Error('VITE_SUPABASE_URL is required');
if (!anon) throw new Error('VITE_SUPABASE_ANON_KEY is required');

export const supabase = createClient(url as string, anon as string, {
  auth: { persistSession: true },
});
