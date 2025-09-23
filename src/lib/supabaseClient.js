import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://aymxzulqrfgygsvrhana.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bXh6dWxxcmZneWdzdnJoYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjMxODgsImV4cCI6MjA3MzE5OTE4OH0.sse8lNHCr-nf2gOdLcmUoibtAsE8iRB5SNKbjFAdjEc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);