import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcpzenciiykmdhzrhamb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcHplbmNpaXlrbWRoenJoYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODcyNjUsImV4cCI6MjA5NTQ2MzI2NX0.INMpv000B0uMDGfNw1msdqLMbfRxGzwcQ4AHAgtLMNk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
