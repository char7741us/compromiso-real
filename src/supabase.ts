import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env
// We handle the case where they might be missing gracefully during development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
