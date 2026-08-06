// Canonical Supabase client for client-side / anon usage.
// Uses runtime checks instead of non-null assertions so missing env vars
// produce a clear error rather than a runtime crash with a confusing message.
//
// FIX: Consolidated from two files (supabase.ts + supabase-client.ts).
// supabase-client.ts is now an alias that re-exports from here.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
