import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Questo ci dirà nel terminale se le chiavi vengono lette o se sono vuote (undefined)
console.log('--- TEST CHIAVI SUPABASE ---')
console.log('URL trovato:', supabaseUrl ? 'Sì, presente' : 'NO, VUOTO')
console.log('Chiave Anon trovata:', supabaseAnonKey ? 'Sì, presente' : 'NO, VUOTO')
console.log('----------------------------')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Mancano le variabili d ambiente di Supabase nel file .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)