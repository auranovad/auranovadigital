import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://frnriivwlldubcebdxeh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybnJpaXZ3bGxkdWJjZWJkeGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjMwODUsImV4cCI6MjA3MDE5OTA4NX0.56xJvKy7kf_9YBsFxDSX7UbRfCqUZM62Z0ZI9753SUE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true }
});
