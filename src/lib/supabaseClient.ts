import { createBrowserClient } from "@supabase/ssr";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "./env";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  NEXT_PUBLIC_SUPABASE_URL ??
  "http://localhost:54321";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "public-anon-key";

if (
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.NODE_ENV !== "production"
) {
  // eslint-disable-next-line no-console
  console.warn("Using fallback Supabase credentials from src/lib/env.ts");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
