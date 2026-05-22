'use client'
import dynamic from 'next/dynamic'

// 🔥 Questo è il trucco: carica il calendario SOLO sul browser del cliente
const CalendarioCiacDinamico = dynamic(
  () => import('./components/CalendarioCiac'), // Controlla che il percorso del file sia corretto!
  { 
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md mx-auto p-6 text-center bg-white rounded-xl border border-gray-200 animate-pulse text-xs font-bold text-gray-400">
        🐾 Caricamento del calendario in corso...
      </div>
    )
  }
)

export default function PaginaCalendario() {
  return (
    <div className="min-h-screen bg-[#f7f5f2] py-6">
      <main className="max-w-md mx-auto px-4 space-y-4">
        
        {/* Intestazione */}
        <header className="border-l-4 border-[#f07f19] pl-3 py-1">
          <h1 className="text-xl font-black text-[#333333] uppercase">
            Calendario Appuntamenti
          </h1>
          <p className="text-gray-500 text-xs font-medium">
            Orari e disponibilità dei campi in tempo reale
          </p>
        </header>

        {/* Il Calendario Reale caricato in modo sicuro */}
        <CalendarioCiacDinamico />

      </main>
    </div>
  )
}