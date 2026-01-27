
import { createClient } from '@supabase/supabase-js';

// Credenciais configuradas para o projeto Kones Gourmet no Supabase
const supabaseUrl = 'https://acrqswxhjbskavifrgol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcnFzd3hoamJza2F2aWZyZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Nzk1NjQsImV4cCI6MjA4NTA1NTU2NH0.eZjaALw8wsn8L0nDo2zosTdjpLWFcG2uYBNK6Va_UL8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
