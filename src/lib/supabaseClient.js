import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Key environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
