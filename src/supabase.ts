import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env
// We handle the case where they might be missing gracefully during development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials missing! Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
