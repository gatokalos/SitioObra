import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytubybkoucltwnselbhc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dWJ5YmtvdWNsdHduc2VsYmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1OTAwMDgsImV4cCI6MjA3NDE2NjAwOH0.hJuYwMc_MGgXIiXPC_3gSe3dRlU0SQ26-xDpC5y8QKo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);