import { createClient } from '@supabase/supabase-js';

// ✅ 上线版：从环境变量读取 (Vercel 会自动注入这些值)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables'); 
}

export const supabase = createClient(supabaseUrl, supabaseKey);