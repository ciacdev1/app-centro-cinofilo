// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Mancano le variabili d ambiente di Supabase nel file .env.local')
  
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Questo dice a Supabase di salvare la sessione nel browser
    autoRefreshToken: true, // Rinnova automaticamente l'accesso senza scadenze improvvise
    detectSessionInUrl: true
  }
})


