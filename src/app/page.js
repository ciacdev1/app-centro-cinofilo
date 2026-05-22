// src/app/page.js
'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [eventi, setEventi] = useState([])
  const [loading, setLoading] = useState(true)
  const [erroreSchermo, setErroreSchermo] = useState(null)
  const [logoError, setLogoError] = useState(false)

  // STATI PER I FILTRI
  const [sedeSelezionata, setSedeSelezionata] = useState('tutte') // 'tutte', 'Varese', 'Busto Arsizio'
  const [periodoSelezionato, setPeriodoSelezionato] = useState('futuri') // 'futuri', 'passati'

  useEffect(() => {
    async function fetchEventi() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .schema('public')
          .from('eventi')
          .select('*')
          .order('data', { ascending: periodoSelezionato === 'futuri' }) // ORDINAMENTO SULLA COLONNA 'data'

        if (error) {
          setErroreSchermo(error.message)
          console.error('Errore Supabase:', error)
        } else {
          setEventi(data || [])
        }
      } catch (err) {
        setErroreSchermo(err.message)
        console.error('Errore generico:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEventi()
  }, [periodoSelezionato])

  // LOGICA DI FILTRAGGIO IN TEMPO REALE
  const adesso = new Date()

  const eventiFiltrati = eventi.filter((evento) => {
    if (!evento.data) return false
    const dataEvento = new Date(evento.data)
    
    // 1. Filtro temporale (Futuri vs Passati)
    const corrispondePeriodo = periodoSelezionato === 'futuri' 
      ? dataEvento >= adesso 
      : dataEvento < adesso

    // 2. Filtro Sede
    const sedeEvento = evento.sede ? evento.sede.toLowerCase().trim() : ''
    const corrispondeSede = sedeSelezionata === 'tutte' || sedeEvento === sedeSelezionata.toLowerCase()

    return corrispondePeriodo && corrispondeSede
  })

  if (erroreSchermo) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#e2dfda] p-6 text-center">
          <div className="w-14 h-14 bg-[#fff1e5] text-[#f07f19] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#333333] mb-2">Impossibile caricare le attività</h2>
          <div className="text-xs font-mono text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 text-left overflow-x-auto">
            {erroreSchermo}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#4a4a4a] antialiased font-sans">
      
      {/* FILTRI DI SELEZIONE */}
      <div className="bg-white border-b border-[#e2dfda] px-4 py-3 space-y-3 shadow-sm">
        <div className="max-w-md mx-auto space-y-2.5">
          
          {/* Selettore Sede */}
          <div className="flex bg-[#f2effa] p-1 rounded-lg text-xs font-bold border border-[#eae6e1]">
            <button 
              onClick={() => setSedeSelezionata('tutte')}
              className={`flex-1 py-2 text-center rounded transition-all ${sedeSelezionata === 'tutte' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500 hover:text-[#333333]'}`}
            >
              Tutte le sedi
            </button>
            <button 
              onClick={() => setSedeSelezionata('Varese')}
              className={`flex-1 py-2 text-center rounded transition-all ${sedeSelezionata === 'Varese' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500 hover:text-[#333333]'}`}
            >
              📍 Varese
            </button>
            <button 
              onClick={() => setSedeSelezionata('Busto Arsizio')}
              className={`flex-1 py-2 text-center rounded transition-all ${sedeSelezionata === 'Busto Arsizio' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500 hover:text-[#333333]'}`}
            >
              📍 Busto A.
            </button>
          </div>

          {/* Selettore Temporale */}
          <div className="flex border-t border-gray-100 pt-2 justify-center gap-6 text-xs font-bold">
            <button 
              onClick={() => setPeriodoSelezionato('futuri')}
              className={`pb-1 border-b-2 transition-all ${periodoSelezionato === 'futuri' ? 'border-[#f07f19] text-[#f07f19]' : 'border-transparent text-gray-400 hover:text-[#333333]'}`}
            >
              In Programma
            </button>
            <button 
              onClick={() => setPeriodoSelezionato('passati')}
              className={`pb-1 border-b-2 transition-all ${periodoSelezionato === 'passati' ? 'border-[#f07f19] text-[#f07f19]' : 'border-transparent text-gray-400 hover:text-[#333333]'}`}
            >
              Eventi Passati
            </button>
          </div>

        </div>
      </div>

      {/* CONTENUTO IN PRIMO PIANO */}
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        
        <header className="space-y-1 border-l-4 border-[#f07f19] pl-3">
          <h1 className="text-xl font-black tracking-tight text-[#333333] uppercase text-left">
            {sedeSelezionata === 'tutte' ? 'Tutte le Attività' : `Sede di ${sedeSelezionata}`}
          </h1>
          <p className="text-gray-500 text-xs font-medium">
            {periodoSelezionato === 'futuri' ? 'I prossimi appuntamenti sul campo' : 'Archivio delle attività concluse'}
          </p>
        </header>

        {/* LISTA ATTIVITÀ FILTRATE */}
        <section className="space-y-4">
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-xl h-60 border border-gray-100" />
              ))}
            </div>
          ) : eventiFiltrati.length === 0 ? (
            
            <div className="text-center py-12 px-6 bg-white rounded-xl border border-[#e2dfda] shadow-sm space-y-2">
              <div className="text-3xl select-none">🐾</div>
              <p className="font-bold text-[#333333] text-sm">Nessun evento corrispondente</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Non ci sono attività {periodoSelezionato === 'futuri' ? 'in programma' : 'passate'} per la selezione corrente.
              </p>
            </div>
          ) : (
            
            <div className="space-y-6">
              {eventiFiltrati.map((evento) => (
                <article 
                  key={evento.id} 
                  className={`group bg-white rounded-xl shadow-sm border border-[#e2dfda] overflow-hidden hover:shadow-md transition-all duration-200 ${periodoSelezionato === 'passati' ? 'opacity-75' : ''}`}
                >
                  {/* LOCANDINA INTERA */}
                  {evento.immagine_url && (
                    <div className="w-full bg-[#1a1a1a] flex items-center justify-center border-b border-[#e2dfda]">
                      <img 
                        src={evento.immagine_url} 
                        alt={evento.titolo} 
                        className={`w-full h-auto max-h-[550px] object-contain ${periodoSelezionato === 'passati' ? 'grayscale opacity-60' : ''}`}
                      />
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-[#4a4a4a] text-white font-bold text-[9px] rounded uppercase tracking-wider">
                        📍 {evento.sede || 'CIAC'}
                      </span>
                      
                      {evento.data && (
                        <div className="bg-[#fff1e5] px-2.5 py-1 rounded text-center border border-[#ffdcc2] shrink-0">
                          <p className="text-xs font-black text-[#f07f19] uppercase leading-none">
                            {new Date(evento.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-black text-lg text-[#333333] leading-tight group-hover:text-[#f07f19] transition-colors uppercase tracking-tight">
                        {evento.titolo}
                      </h3>
                      {evento.descrizione && (
                        <p className="text-xs text-[#555555] leading-relaxed font-normal pt-2 border-t border-gray-100">
                          {evento.descrizione}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-12 text-[10px] text-gray-400 font-bold tracking-wider uppercase space-y-1">
        <p>© 2026 CIAC — Centro Istruzione Amici del Cane</p>
        <p className="font-mono text-[#f07f19]">Varese • Busto Arsizio</p>
      </footer>
    </div>
  )
}