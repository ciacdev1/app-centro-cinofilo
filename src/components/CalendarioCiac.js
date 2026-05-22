'use client'
import { useState, useEffect } from 'react'

export default function CalendarioCiac() {
  const [eventi, setEventi] = useState([])
  const [eventiFiltrati, setEventiFiltrati] = useState([])
  const [filtroCorrente, setFiltroCorrente] = useState('all')
  const [caricamento, setCaricamento] = useState(true)
  
  // Stato Modale Dettagli
  const [popupInfo, setPopupInfo] = useState({ visibile: false, titolo: '', orario: '' })

  // Data di riferimento per la navigazione delle settimane
  const [dataRiferimento, setDataRiferimento] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const DATA_URL = "https://script.google.com/macros/s/AKfycbxKP4pZ9NVuLONpyjI8J0HlW7X98o8fhXxinQw6ZJYNMu1wIxD5rmur-37HO8khK6G-rg/exec"

  // Sincronizzazione con Google Script
  useEffect(() => {
    async function scaricaEventi() {
      try {
        setCaricamento(true)
        const res = await fetch(DATA_URL)
        const data = await res.json()
        
        const mapped = data.map(e => {
          let sede = 'altre'
          if (e.title.includes("[Varese]")) sede = 'varese'
          if (e.title.includes("[Busto]")) sede = 'busto'
          return { ...e, sede }
        })
        
        setEventi(mapped)
      } catch (err) {
        console.error("Errore nel caricamento del Google Script:", err)
      } finally {
        setCaricamento(false)
      }
    }
    scaricaEventi()
    
    const interval = setInterval(scaricaEventi, 300000)
    return () => clearInterval(interval)
  }, [])

  // Calcolo dei 7 giorni della settimana corrente (Lun - Dom)
  const ottieniGiorniSettimana = () => {
    const giornoCorrente = dataRiferimento.getDay()
    const diffLunedio = giornoCorrente === 0 ? -6 : 1 - giornoCorrente
    
    const lunedi = new Date(dataRiferimento)
    lunedi.setDate(dataRiferimento.getDate() + diffLunedio)
    
    const giorni = []
    for (let i = 0; i < 7; i++) {
      const giorno = new Date(lunedi)
      giorno.setDate(lunedi.getDate() + i)
      giorni.push(giorno)
    }
    return giorni
  }

  const giorniVisualizzati = ottieniGiorniSettimana()
  const inizioSettimana = giorniVisualizzati[0]
  const fineSettimana = new Date(giorniVisualizzati[6])
  fineSettimana.setHours(23, 59, 59, 999)

  // Filtraggio dinamico temporale e per sede
  useEffect(() => {
    let filtrati = eventi.filter(e => {
      const dataInizioEffettiva = new Date(e.start)
      return dataInizioEffettiva >= inizioSettimana && dataInizioEffettiva <= fineSettimana
    })

    if (filtroCorrente === 'varese') {
      filtrati = filtrati.filter(e => e.sede === 'varese')
    } else if (filtroCorrente === 'busto') {
      filtrati = filtrati.filter(e => e.sede === 'busto')
    }

    // Ordina cronologicamente per orario
    filtrati.sort((a, b) => new Date(a.start) - new Date(b.start))

    setEventiFiltrati(filtrati)
  }, [eventi, filtroCorrente, dataRiferimento])

  // Controlli Navigazione
  const settimanaSuccessiva = () => {
    const nuovaData = new Date(dataRiferimento)
    nuovaData.setDate(dataRiferimento.getDate() + 7)
    setDataRiferimento(nuovaData)
  }

  const settimanaPrecedente = () => {
    const nuovaData = new Date(dataRiferimento)
    nuovaData.setDate(dataRiferimento.getDate() - 7)
    setDataRiferimento(nuovaData)
  }

  const vaiAOggi = () => {
    setDataRiferimento(new Date())
  }

  const gestisciClickEvento = (evento) => {
    const opzioni = { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    const inizio = new Date(evento.start)
    let stringaOrario = inizio.toLocaleDateString("it-IT", opzioni)

    if (evento.end) {
      const fine = new Date(evento.end)
      if (inizio.toDateString() === fine.toDateString()) {
        stringaOrario += " - " + fine.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' })
      } else {
        stringaOrario += " fino a " + fine.toLocaleDateString("it-IT", opzioni)
      }
    }

    setPopupInfo({
      visibile: true,
      titolo: evento.title,
      orario: stringaOrario.replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    })
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#e2dfda] shadow-xs space-y-4 font-sans">
      
      {/* 🔝 RANGE DELLA SETTIMANA (Es. 18 - 24 mag 2026) */}
      <div className="text-center py-2 text-sm font-bold text-gray-600 tracking-wide">
        {inizioSettimana.getDate()} — {fineSettimana.getDate()} {inizioSettimana.toLocaleDateString('it-IT', { month: 'short' })} {inizioSettimana.getFullYear()}
      </div>

      {/* 🎛️ BOTTONI FILTRO & NAVIGAZIONE COMPATTI */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 bg-gray-50/60 p-2 rounded-xl border border-gray-100">
        <button 
          onClick={() => setFiltroCorrente('all')}
          className={`px-3 py-1 text-xs font-bold uppercase rounded-md border transition-all ${filtroCorrente === 'all' ? 'bg-[#f07f19] text-white border-[#f07f19]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
        >
          Tutti
        </button>
        <button 
          onClick={() => setFiltroCorrente('varese')}
          className={`px-3 py-1 text-xs font-bold uppercase rounded-md border transition-all ${filtroCorrente === 'varese' ? 'bg-[#1e88e5] text-white border-[#1e88e5]' : 'bg-white text-[#1e88e5] border-gray-200 hover:bg-gray-100'}`}
        >
          Varese
        </button>
        <button 
          onClick={() => setFiltroCorrente('busto')}
          className={`px-3 py-1 text-xs font-bold uppercase rounded-md border transition-all ${filtroCorrente === 'busto' ? 'bg-[#e53935] text-white border-[#e53935]' : 'bg-white text-[#e53935] border-gray-200 hover:bg-gray-100'}`}
        >
          Busto
        </button>
        
        <div className="h-4 w-px bg-gray-300 mx-1"></div>

        <button onClick={vaiAOggi} className="px-2.5 py-1 bg-white border border-gray-200 text-[10px] font-black uppercase rounded-md text-gray-600 hover:bg-gray-100">
          Oggi
        </button>
        <button onClick={settimanaPrecedente} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-md font-bold text-xs">
          &lt;
        </button>
        <button onClick={settimanaSuccessiva} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-md font-bold text-xs">
          &gt;
        </button>
      </div>

      {/* 🗓️ AGENDA AD ELENCO (COME DA SCREENSHOT) */}
      {caricamento ? (
        <div className="text-center py-12 text-xs font-bold text-gray-400 animate-pulse">
          🐾 Sincronizzazione con il database lezioni...
        </div>
      ) : (
        <div className="space-y-4">
          {giorniVisualizzati.map((giorno, idx) => {
            const stringaGiorno = giorno.toDateString()
            const eventiDelGiorno = eventiFiltrati.filter(e => new Date(e.start).toDateString() === stringaGiorno)
            
            // Mostriamo il giorno solo se ha eventi programmati (evita liste vuote giganti)
            if (eventiDelGiorno.length === 0) return null;

            return (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                
                {/* BARRA DEL GIORNO (Es: martedì | 19 maggio 2026) */}
                <div className="bg-[#fdfbf7] border-b border-gray-200 px-3 py-2 flex justify-between items-center">
                  <span className="text-sm font-black text-[#f07f19] lowercase">
                    {giorno.toLocaleDateString('it-IT', { weekday: 'long' })}
                  </span>
                  <span className="text-xs font-bold text-[#f07f19]/80">
                    {giorno.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* RIGHE DELLE LEZIONI IN FILA */}
                <div className="divide-y divide-gray-100">
                  {eventiDelGiorno.map((ev, eIdx) => {
                    const orarioInizio = new Date(ev.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                    const orarioFine = ev.end ? new Date(ev.end).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''

                    return (
                      <div
                        key={eIdx}
                        onClick={() => gestisciClickEvento(ev)}
                        className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer select-none transition-colors border-l-4 text-xs font-semibold
                          ${ev.sede === 'varese' 
                            ? 'bg-[#e3f2fd]/50 border-l-[#1e88e5] text-gray-800 hover:bg-[#e3f2fd]/80' 
                            : ev.sede === 'busto' 
                            ? 'bg-[#ffebee]/50 border-l-[#e53935] text-gray-800 hover:bg-[#ffebee]/80' 
                            : 'bg-white border-l-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {/* Fascia Oraria Estesa */}
                        <div className="text-gray-600 font-bold min-w-[75px] shrink-0 tabular-nums">
                          {orarioInizio} {orarioFine && `- ${orarioFine}`}
                        </div>

                        {/* Pallino Colorato Identificativo */}
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ev.sede === 'varese' ? 'bg-[#1e88e5]' : ev.sede === 'busto' ? 'bg-[#e53935]' : 'bg-gray-400'}`}></span>

                        {/* Titolo Lezione / Allievo */}
                        <div className="text-black font-medium leading-normal flex-1">
                          {ev.title}
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* 🔥 MODALE POPUP AL CLICK */}
      {popupInfo.visibile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-gray-100 space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-gray-900 leading-snug">{popupInfo.titolo}</h4>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <span>⏰</span> {popupInfo.orario}
              </p>
            </div>
            <button 
              onClick={() => setPopupInfo({ ...popupInfo, visibile: false })}
              className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase rounded-xl transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

    </div>
  )
}