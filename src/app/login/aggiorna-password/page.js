'use client'
import { useState, useEffect } from 'react'
// Correzione del path: sali di 3 livelli per arrivare alla cartella src
import { supabase } from '../../supabase'
import { useRouter } from 'next/navigation'

export default function AggiornaPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)
  const router = useRouter()

  // Controllo sessione: se l'utente non è loggato, non può essere qui
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        // Se non c'è sessione, torna al login
        router.push('/login')
      }
    }
    checkUser()
  }, [router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrore(null)

    // Ora usiamo direttamente updateUser senza passare token
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setErrore("Errore: " + error.message)
    } else {
      alert("Password aggiornata con successo!")
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleUpdate} className="p-8 bg-white shadow-md rounded-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Nuova Password</h2>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Inserisci nuova password" 
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-2 bg-orange-500 text-white rounded font-bold"
        >
          {loading ? 'Salvataggio...' : 'Salva Password'}
        </button>
        {errore && <p className="text-red-500 text-xs mt-4">{errore}</p>}
      </form>
    </div>
  )
}