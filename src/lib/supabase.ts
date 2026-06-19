import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://azauqcnijpdptlvxyapu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6YXVxY25panBkcHRsdnh5YXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTg5NTYsImV4cCI6MjA5MzI5NDk1Nn0.mgwN9ZFlkT0jZF7vD5EptEGNZe-aHE8wVEb9hWVV2QQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
