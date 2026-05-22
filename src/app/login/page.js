'use client'
import { useState, useEffect } from 'react' // Pulito e raggruppato qui
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase' // Usa il tuo percorso originale per supabase

export default function Login() {
  // Stati di navigazione interna: 'login' | 'registrati' | 'reset'
  const [vista, setVista] = useState('login')
  
  // Campi Input
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [ruoloSelezionato, setRuoloSelezionato] = useState('operatore')
  
  // Stati di Feedback
  const [loading, setLoading] = useState(false)
  const [messaggioInfo, setMessaggioInfo] = useState('')
  const [errore, setErrore] = useState('')
  
  const router = useRouter()

  // Controllo automatico della sessione per non perdere il login
  useEffect(() => {
    const recuperaSessioneEsistente = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Se l'utente è già loggato, lo mandiamo alla dashboard/home principale
        router.push('/formazione') // <-- Modifica '/dashboard' con il percorso reale della tua home privata online
      }
    }

    recuperaSessioneEsistente()

    // Resta in ascolto se l'utente fa login o logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push('/formazione') // <-- Modifica anche qui con il percorso reale
      } else {
        setVista('login') 
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // 1. GESTIONE ACCESSO (LOGIN)
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    setMessaggioInfo('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) throw new Error('Credenziali non valide o utente inesistente.')

      // Controlla se l'account è stato approvato dall'Admin
      const { data: profilo, error: profError } = await supabase
        .from('profili')
        .select('approvato')
        .eq('id', authData.user.id)
        .single()

      if (profError || !profilo?.approvato) {
        await supabase.auth.signOut()
        throw new Error('🐾 Il tuo account è in attesa di approvazione da parte della segreteria CIAC.')
      }

      // Se approvato, vai alla piattaforma
      router.push('/formazione')
      router.refresh()
    } catch (err) {
      setErrore(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. GESTIONE REGISTRAZIONE (NUOVO ACCOUNT IN ATTESA)
  const handleRegistrazione = async (e) => {
  e.preventDefault()
  setLoading(true)
  setErrore('')
  setMessaggioInfo('')

  try {
    if (!nome || !cognome) throw new Error('Inserisci nome e cognome completi.')

    // Determina il ruolo in base alla selezione del form.
    // Se non è stato selezionato nulla, usa 'puppy' come sicurezza.
    const ruoloDaAssegnare = ruoloSelezionato ? ruoloSelezionato.trim() : 'puppy'

    // Unica chiamata a Supabase Auth: passiamo tutti i dati nei metadati.
    // Il Trigger sul database intercetterà questa chiamata e creerà automaticamente 
    // i record nelle tabelle 'profili' (con approvato = false) e 'utenti_ruoli'.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          nome: nome.trim(),
          cognome: cognome.trim(),
          email: email.trim(),      // Passata nei metadati per sicurezza del Trigger
          ruolo: ruoloDaAssegnare   // Passa dinamicamente il ruolo (es. operatore, educatore)
        }
      }
    })

    if (authError) throw authError

    // Se l'utente è stato creato con successo, la transazione sul database è completata
    if (authData?.user) {
      setMessaggioInfo('🎉 Registrazione ricevuta! Non appena l\'amministratore verificherà la tua iscrizione al corso, riceverai l\'abilitazione ad accedere.')
      setVista('login')
      
      // Pulisci i campi del form
      setPassword('')
      setNome('')
      setCognome('')
      setEmail('') // Aggiunto per pulire anche il campo email
    }
  } catch (err) {
    setErrore(err.message)
  } finally {
    setLoading(false)
  }
}
  // 3. GESTIONE RESET PASSWORD
 
const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    setMessaggioInfo('')

    try {
      // Usiamo il callback per gestire il flusso PKCE moderno
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`, 
      })

      if (error) throw error

      setMessaggioInfo('✉️ Ti abbiamo inviato un\'e-mail. Clicca sul link e verrai reindirizzato alla pagina di aggiornamento password.')
      setVista('login')
    } catch (err) {
      setErrore('Impossibile inviare l\'e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex flex-col items-center justify-center px-4 antialiased font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#e2dfda] shadow-sm p-6 space-y-6">
        
        {/* LOGO E INTESTAZIONE */}
        <div className="text-center space-y-1">
          <div className="text-3xl inline-block bg-[#fff1e5] p-3 rounded-2xl">🐾</div>
          <h1 className="text-xl font-black text-[#333333] uppercase tracking-tight mt-2">Piattaforma CIAC</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {vista === 'login' && 'Area Riservata Formazione'}
            {vista === 'registrati' && 'Richiesta di Iscrizione'}
            {vista === 'reset' && 'Ripristina Credenziali'}
          </p>
        </div>

        {/* FEEDBACK STATUS */}
        {errore && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded-xl text-center">
            {errore}
          </div>
        )}
        {messaggioInfo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium p-4 rounded-xl text-center leading-relaxed">
            {messaggioInfo}
          </div>
        )}

        {/* 1. SCHERMATA LOGIN */}
        {vista === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Indirizzo Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl text-gray-800 focus:outline-hidden focus:border-[#f07f19]" placeholder="esempio@email.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black uppercase text-gray-400">Password</label>
                <button type="button" onClick={() => setVista('reset')} className="text-[10px] font-bold text-[#f07f19] hover:underline">Password dimenticata?</button>
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl text-gray-800 focus:outline-hidden focus:border-[#f07f19]" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-[#f07f19] text-white text-xs font-black uppercase rounded-xl shadow-xs tracking-wider">
              {loading ? 'Verifica credenziali...' : 'Accedi all\'Area Riservata'}
            </button>
          </form>
        )}

        {/* 2. SCHERMATA REGISTRAZIONE */}
        {vista === 'registrati' && (
          <form onSubmit={handleRegistrazione} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Nome</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl" placeholder="Mario" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Cognome</label>
                <input type="text" required value={cognome} onChange={(e) => setCognome(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl" placeholder="Rossi" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Corso di Riferimento</label>
              <select value={ruoloSelezionato} onChange={(e) => setRuoloSelezionato(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-white border border-[#e2dfda] rounded-xl text-gray-800 font-medium">
                <option value="operatore">📚 Percorso Operatore Cinofilo</option>
                <option value="educatore">🎓 Percorso Educatore Cinofilo</option>
                <option value="puppy">🐶 Famiglia Corso Puppy Class</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl" placeholder="mario.rossi@email.com" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Scegli una Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl" placeholder="Minimo 6 caratteri" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl tracking-wider">
              {loading ? 'Invio richiesta in corso...' : 'Invia Richiesta Registrazione'}
            </button>
          </form>
        )}

        {/* 3. SCHERMATA RESET PASSWORD */}
        {vista === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Inserisci l'indirizzo email con cui ti sei registrato. Riceverai un link per configurare una nuova password.
            </p>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Tua Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-[#e2dfda] rounded-xl" placeholder="esempio@email.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 text-white text-xs font-black uppercase rounded-xl tracking-wider">
              {loading ? 'Inviando e-mail...' : 'Invia Link di Ripristino'}
            </button>
          </form>
        )}

        {/* NAVIGAZIONE FOOTER TRA LE VISTE */}
        <div className="border-t border-gray-100 pt-4 text-center text-xs">
          {vista === 'login' && (
            <p className="text-gray-400 font-medium">
              Non hai ancora un account?{' '}
              <button onClick={() => { setVista('registrati'); setErrore(''); setMessaggioInfo(''); }} className="text-[#f07f19] font-black uppercase hover:underline">Registrati</button>
            </p>
          )}
          {vista !== 'login' && (
            <button onClick={() => { setVista('login'); setErrore(''); setMessaggioInfo(''); }} className="text-gray-500 font-black uppercase tracking-wider text-[11px] hover:text-[#f07f19]">
              ← Torna al Login
            </button>
          )}
        </div>

      </div>
    </div>
  )
}