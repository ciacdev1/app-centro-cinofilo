// src/app/supabase.js
import { createClient } from '@supabase/supabase-js'

// Ho inserito gli apici '' e pulito l'URL
const supabaseUrl = 'https://cedqgjbygirxbhyzajzq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHFnamJ5Z2lyeGJoeXphanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTQzNjQsImV4cCI6MjA5NDc3MDM2NH0.4j9slKqeinXYt_lwUM-90zPaEzCbKOe2fK1ir2zf5NQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)