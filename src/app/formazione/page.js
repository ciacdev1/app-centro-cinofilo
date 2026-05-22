'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '../supabase'

// Importazione dinamica del calendario
const CalendarioCiacDinamico = dynamic(
  () => import('../../components/CalendarioCiac'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full text-center py-12 bg-white rounded-2xl border border-[#e2dfda] animate-pulse text-xs font-bold text-gray-400">
        🐾 Caricamento del calendario lezioni...
      </div>
    )
  }
)

export default function Formazione() {
  const [utente, setUtente] = useState(null)
  const [ruoli, setRuoli] = useState([])
  const [materiali, setMateriali] = useState([])
  const [docenti, setDocenti] = useState([]) // Cambiato: ora carica profili docenti
  const [librettoOre, setLibrettoOre] = useState([])
  const [richiesteDaApprovare, setRichiesteDaApprovare] = useState([])
  const [tutteLeRichiesteAdmin, setTutteLeRichiesteAdmin] = useState([]) // Storico globale Admin
  const [accountDaApprovare, setAccountDaApprovare] = useState([]) // Nuovi account in attesa per Admin
  
  // Stati del Modulo Inserimento Ore
  const [dataTirocinio, setDataTirocinio] = useState('')
  const [oreEffettuate, setOreEffettuate] = useState('')
  const [docenteSelezionato, setDocenteSelezionato] = useState('')
  const [tipoTirocinio, setTipoTirocinio] = useState('corso_gruppo')
  const [noteAllievo, setNoteAllievo] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [invioLoading, setInvioLoading] = useState(false)
  const [sezioneAttiva, setSezioneAttiva] = useState('formazione') 
  const router = useRouter()

  // Mappatura Ruoli Espliciti
  const isAdmin = ruoli.includes('admin')
  const isDocente = ruoli.includes('docente')
  const isAllievoProfessionista = ruoli.includes('operatore') || ruoli.includes('educatore')
  const isPuppy = ruoli.includes('puppy') && !isAllievoProfessionista && !isDocente && !isAdmin

  const isOperatore = ruoli.includes('operatore') || ruoli.includes('admin')
  const isEducatore = ruoli.includes('educatore') || ruoli.includes('admin')

  useEffect(() => {
    async function inizializzaAreaRiservata() {
      try {
        setLoading(true)
        
        // 1. Controlla sessione utente
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        // 2. Recupera profilo utente
        const { data: profilo, error: profError } = await supabase
          .from('profili')
          .select('approvato, nome, cognome')
          .eq('id', session.user.id)
          .single()

        if (profError || !profilo?.approvato) {
          await supabase.auth.signOut()
          router.push('/login')
          return
        }
        setUtente(profilo)

        // 3. Recupera ruoli utente
        const { data: ruoliData } = await supabase
          .from('utenti_ruoli')
          .select('ruolo')
          .eq('profilo_id', session.user.id)

        const listaRuoli = ruoliData ? ruoliData.map(r => r.ruolo) : []
        setRuoli(listaRuoli)

        // Imposta la sezione di default intelligente in base al ruolo
        if (listaRuoli.includes('docente') || listaRuoli.includes('admin')) {
          setSezioneAttiva('approvazioni')
        } else {
          setSezioneAttiva('formazione')
        }

        // 4. CARICAMENTO DOCENTI DA PROFILI (FILTRATI PER RUOLO DOCENTE)
        /*const { data: docentiData } = await supabase
          .from('profili')
          .select('id, nome, cognome, nome_pubblico, utenti_ruoli!inner(ruolo)')
          .eq('utenti_ruoli.ruolo', 'docente')
        
        if (docentiData) {
          setDocenti(docentiData)
        }*/
       // 4. CARICAMENTO DOCENTI ROBUSTO (Metodo 2-Step per evitare errori RLS)
        const { data: docentiRel, error: relError } = await supabase
          .from('utenti_ruoli')
          .select('profilo_id')
          .eq('ruolo', 'docente');

        if (docentiRel && docentiRel.length > 0) {
          const ids = docentiRel.map(r => r.profilo_id);
          const { data: profiliDocenti, error: profError } = await supabase
            .from('profili')
            .select('id, nome, cognome, nome_pubblico')
            .in('id', ids);
            
          if (profiliDocenti) {
            setDocenti(profiliDocenti);
          }
        }

        // 5. Carica Materiali / Dispense
        const { data: matData } = await supabase
          .from('materiali')
          .select('*')
          .order('titolo', { ascending: true })
        setMateriali(matData || [])

        // 6. Carica dati del Libretto Ore dell'allievo (se è un allievo o admin)
        const { data: oreData } = await supabase
          .from('ore_tirocinio')
          .select('*')
          .eq('allievo_id', session.user.id)
          .order('data_tirocinio', { ascending: false })
        setLibrettoOre(oreData || [])

        // 7. CARICAMENTO RICHIESTE DA APPROVARE ED ACCOUNT PER DOCENTI E ADMIN
        /*if (listaRuoli.includes('docente') || listaRuoli.includes('admin')) {
          
          if (listaRuoli.includes('admin')) {
            const { data: allReqs } = await supabase
              .from('ore_tirocinio')
              .select('*')
              .order('created_at', { ascending: true })
            setTutteLeRichiesteAdmin(allReqs || [])

            const { data: accountsData, error: accError } = await supabase
              .from('profili')
              .select('*')
            
            if (accError) {
              console.error("Errore recupero account admin:", accError)
            } else if (accountsData) {
              const filtrati = accountsData.filter(p => {
                if (p.approvato === false || p.approvato === null || p.approvato === undefined) return true;
                const stringaApprovato = String(p.approvato).toLowerCase().trim();
                return stringaApprovato === 'false' || stringaApprovato === '';
              })
              setAccountDaApprovare(filtrati)
            }
          }

          
          const queryDocente = supabase.from('ore_tirocinio').select('*').eq('stato', 'in_attesa')
          


          
          if (!listaRuoli.includes('admin')) {
            queryDocente.eq('docente_id', session.user.id)
          }
          const { data: requestsData } = await queryDocente.order('created_at', { ascending: true })
          setRichiesteDaApprovare(requestsData || [])
        }

      } catch (err) {
        console.error('Errore inizializzazione:', err)
      } finally {
        setLoading(false)
      }
    }*/




    // 7. CARICAMENTO RICHIESTE DA APPROVARE ED ACCOUNT PER DOCENTI E ADMIN
        if (listaRuoli.includes('docente') || listaRuoli.includes('admin')) {
          
          if (listaRuoli.includes('admin')) {
            const { data: allReqs } = await supabase
              .from('ore_tirocinio')
              .select('*')
              .order('created_at', { ascending: true })
            setTutteLeRichiesteAdmin(allReqs || [])

            const { data: accountsData, error: accError } = await supabase
              .from('profili')
              .select('*')
            
            if (accError) {
              console.error("Errore recupero account admin:", accError)
            } else if (accountsData) {
              const filtrati = accountsData.filter(p => {
                if (p.approvato === false || p.approvato === null || p.approvato === undefined) return true;
                const stringaApprovato = String(p.approvato).toLowerCase().trim();
                return stringaApprovato === 'false' || stringaApprovato === '';
              })
              setAccountDaApprovare(filtrati)
            }
          }

          // Inizializza la query base
          const queryDocente = supabase
            .from('ore_tirocinio')
            .select('*')
            .eq('stato', 'in_attesa');

          // Filtra per il docente loggato usando la NUOVA colonna UUID
          if (!listaRuoli.includes('admin')) {
            queryDocente.eq('docente_profilo_id', session.user.id);
          }
          
          const { data: requestsData, error: reqError } = await queryDocente.order('created_at', { ascending: true });
          
          // ... (fine del blocco if del punto 7 precedente)
          if (reqError) {
            console.error("Errore recupero richieste docente:", reqError);
          } else {
            setRichiesteDaApprovare(requestsData || []);
          }
        }
      } catch (err) {
        console.error('Errore inizializzazione:', err)
      } finally {
        setLoading(false)
      }
    }

    inizializzaAreaRiservata()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const gestisciInserimentoOre = async (e) => {
    e.preventDefault()
    if (!dataTirocinio || !oreEffettuate || !docenteSelezionato) {
      alert("Per favore, compila tutti i campi.");
      return;
    }
    
    setInvioLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const nuovaRichiesta = {
        allievo_id: session.user.id,
        allievo_nome: `${utente.nome} ${utente.cognome}`,
        data_tirocinio: dataTirocinio,
        ore_effettuate: parseFloat(oreEffettuate),
        docente_profilo_id: docenteSelezionato, 
        tipo_tirocinio: tipoTirocinio,
        note_allievo: noteAllievo,
        stato: 'in_attesa'
      }

      const { data, error } = await supabase
        .from('ore_tirocinio')
        .insert([nuovaRichiesta])
        .select()
        
      if (error) throw error

      setLibrettoOre([data[0], ...librettoOre])
      setDataTirocinio('')
      setOreEffettuate('')
      setDocenteSelezionato('')
      setNoteAllievo('')
      alert('Richiesta inviata correttamente al docente!')
    } catch (err) {
      console.error("Errore invio:", err)
      alert('Errore durante l\'invio delle ore: ' + err.message)
    } finally {
      setInvioLoading(false)
    }
  }

  const gestisciDecisioneDocente = async (idRichiesta, nuovoStato) => {
    try {
      const { error } = await supabase
        .from('ore_tirocinio')
        .update({ stato: nuovoStato })
        .eq('id', idRichiesta)

      if (error) throw error

      setRichiesteDaApprovare(richiesteDaApprovare.filter(r => r.id !== idRichiesta))
      setTutteLeRichiesteAdmin(tutteLeRichiesteAdmin.map(r => r.id === idRichiesta ? { ...r, stato: nuovoStato } : r))
      
      alert(`Stato aggiornato con successo in: ${nuovoStato}`)
    } catch (err) {
      console.error(err)
      alert('Impossibile aggiornare la richiesta.')
    }
  }

  const gestisciApprovazioneAccount = async (idProfilo) => {
    try {
      const { error } = await supabase
        .from('profili')
        .update({ approvato: true })
        .eq('id', idProfilo)

      if (error) throw error

      setAccountDaApprovare(accountDaApprovare.filter(acc => acc.id !== idProfilo))
      alert('Account abilitato con successo! Ora l\'utente può effettuare l\'accesso.')
    } catch (err) {
      console.error(err)
      alert('Impossibile approvare l\'account.')
    }
  
  }

  // Calcoli contatori ore per allievi
  const oreGruppoApprovate = librettoOre.filter(r => r.stato === 'approvato' && r.tipo_tirocinio === 'corso_gruppo').reduce((sum, r) => sum + Number(r.ore_effettuate), 0)
  const oreIndividualiApprovate = librettoOre.filter(r => r.stato === 'approvato' && r.tipo_tirocinio === 'lezione_individuale').reduce((sum, r) => sum + Number(r.ore_effettuate), 0)
  const totaleOreApprovate = oreGruppoApprovate + oreIndividualiApprovate

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#f07f19] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#4a4a4a] antialiased font-sans pb-12">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        
        {/* INFO UTENTE & RUOLO */}
        <div className="bg-white rounded-2xl border border-[#e2dfda] p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fff1e5] flex items-center justify-center text-sm">🐾</div>
            <div>
              <p className="text-[10px] font-bold text-[#f07f19] uppercase tracking-wider leading-none">
                {isAdmin ? '👑 Amministratore' : isDocente ? '👨‍🏫 Docente Staff' : '📖 Allievo Corso'}
              </p>
              <h2 className="text-xs font-black text-[#333333] uppercase mt-0.5">{utente?.nome} {utente?.cognome}</h2>
            </div>
          </div>
          <button onClick={handleLogout} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 text-[10px] font-black rounded-xl uppercase tracking-wider transition-colors">
            Esci
          </button>
        </div>

        {/* NAV TAB DINAMICA IN BASE AI RUOLI */}
        {(isAllievoProfessionista || isDocente || isAdmin) && (
          <div className="bg-white p-1 rounded-xl border border-[#e2dfda] flex text-xs font-bold shadow-sm overflow-x-auto whitespace-nowrap">
            {(isAllievoProfessionista || isAdmin) && (
              <button 
                onClick={() => setSezioneAttiva('formazione')}
                className={`flex-1 py-2 px-3 text-center rounded-lg transition-all ${sezioneAttiva === 'formazione' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500'}`}
              >
                📚 Dispense
              </button>
            )}
            {(isAllievoProfessionista || isAdmin || isDocente) && (
              <button 
                onClick={() => setSezioneAttiva('calendario')}
                className={`flex-1 py-2 px-3 text-center rounded-lg transition-all ${sezioneAttiva === 'calendario' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500'}`}
              >
                🗓️ Calendario
              </button>
            )}
            {(isAllievoProfessionista || isAdmin) && (
              <button 
                onClick={() => setSezioneAttiva('libretto')}
                className={`flex-1 py-2 px-3 text-center rounded-lg transition-all ${sezioneAttiva === 'libretto' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500'}`}
              >
                📖 Mio Libretto
              </button>
            )}
            {(isDocente || isAdmin) && (
              <button 
                onClick={() => setSezioneAttiva('approvazioni')}
                className={`flex-1 py-2 px-3 text-center rounded-lg transition-all ${sezioneAttiva === 'approvazioni' ? 'bg-[#f07f19] text-white shadow-sm' : 'text-gray-500'}`}
              >
                🔔 Gestione { (richiesteDaApprovare.length + accountDaApprovare.length) > 0 && `(${(richiesteDaApprovare.length + accountDaApprovare.length)})`}
              </button>
            )}
          </div>
        )}

        {/* VISTA ALLIEVI PUPPY */}
        {isPuppy && (
          <div className="bg-white rounded-2xl border border-[#e2dfda] shadow-sm p-6 text-center text-xs text-gray-500 space-y-2">
            <div className="text-2xl">🐶</div>
            <p className="font-bold text-gray-700">Spazio Famiglie Puppy Class</p>
            <p>Le dispense e i materiali dedicati ai cuccioli compariranno non appena caricate dai tuoi istruttori.</p>
          </div>
        )}

        {/* TAB 1: DISPENSE DIDATTICHE */}
        {sezioneAttiva === 'formazione' && (isAllievoProfessionista || isAdmin) && (
          <div className="space-y-4">
            <header className="space-y-0.5 border-l-4 border-[#f07f19] pl-3">
              <h1 className="text-base font-black tracking-tight text-[#333333] uppercase">Dispense Didattiche</h1>
              <p className="text-gray-500 text-[11px] font-medium">I tuoi materiali per lo studio e la formazione.</p>
            </header>

            <div className="space-y-4">
              {isOperatore && (
                <div className="bg-white rounded-xl border border-[#e2dfda] shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-[#e2dfda]">
                    <h3 className="text-xs font-black text-[#333333] uppercase">📚 Corso Operatori</h3>
                  </div>
                  <div className="p-3 divide-y divide-gray-100">
                    {materiali.filter(m => m.categoria === 'dispense_operatore').length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">Nessuna dispensa inserita al momento.</p>
                    ) : (
                      materiali.filter(m => m.categoria === 'dispense_operatore').map(mat => (
                        <div key={mat.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="text-xs font-bold text-[#333333]">{mat.titolo}</div>
                          <a href={mat.url_file} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase hover:bg-gray-200">Apri</a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {isEducatore && (
                <div className="bg-white rounded-xl border border-[#e2dfda] shadow-sm overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-900">
                    <h3 className="text-xs font-black text-white uppercase">🎓 Corso Educatori</h3>
                  </div>
                  <div className="p-3 divide-y divide-gray-100">
                    {materiali.filter(m => m.categoria === 'dispense_educatore').length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">Nessuna dispensa inserita al momento.</p>
                    ) : (
                      materiali.filter(m => m.categoria === 'dispense_educatore').map(mat => (
                        <div key={mat.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="text-xs font-bold text-[#333333]">{mat.titolo}</div>
                          <a href={mat.url_file} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase hover:bg-[#f07f19] hover:text-white">Apri</a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CALENDARIO */}
        {sezioneAttiva === 'calendario' && (isAllievoProfessionista || isDocente || isAdmin) && (
          <div className="space-y-4">
            <header className="space-y-0.5 border-l-4 border-[#f07f19] pl-3">
              <h1 className="text-base font-black tracking-tight text-[#333333] uppercase">Pianificazione Lezioni</h1>
            </header>
            <CalendarioCiacDinamico />
          </div>
        )}

        {/* TAB 3: LIBRETTO PERSONALE */}
        {sezioneAttiva === 'libretto' && (isAllievoProfessionista || isAdmin) && (
          <div className="space-y-4">
            <header className="space-y-0.5 border-l-4 border-[#f07f19] pl-3">
              <h1 className="text-base font-black tracking-tight text-[#333333] uppercase">Mio Libretto Ore</h1>
            </header>

            {/* CONTATORI */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-xl border border-[#e2dfda] text-center shadow-xs">
                <span className="text-xs font-black text-gray-800">{totaleOreApprovate}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Ore Totali</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#e2dfda] text-center shadow-xs">
                <span className="text-xs font-black text-emerald-600">{oreGruppoApprovate}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Gruppo 👥</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#e2dfda] text-center shadow-xs">
                <span className="text-xs font-black text-sky-600">{oreIndividualiApprovate}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Individuali 👤</p>
              </div>
            </div>

            {/* MODULO INSERIMENTO ORE */}
            <div className="bg-white rounded-xl border border-[#e2dfda] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-1.5">✍️ Registra Sessione</h3>
              <form onSubmit={gestisciInserimentoOre} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Data</label>
                    <input type="date" required value={dataTirocinio} onChange={(e) => setDataTirocinio(e.target.value)} className="w-full text-xs px-2.5 py-2 bg-gray-50 border border-[#e2dfda] rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Numero Ore</label>
                    <input type="number" step="0.5" required placeholder="Es. 2" value={oreEffettuate} onChange={(e) => setOreEffettuate(e.target.value)} className="w-full text-xs px-2.5 py-2 bg-gray-50 border border-[#e2dfda] rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Tipo Attività</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setTipoTirocinio('corso_gruppo')} className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${tipoTirocinio === 'corso_gruppo' ? 'bg-[#fff1e5] border-[#f07f19] text-[#f07f19]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>👥 Corso Gruppo</button>
                    <button type="button" onClick={() => setTipoTirocinio('lezione_individuale')} className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${tipoTirocinio === 'lezione_individuale' ? 'bg-[#fff1e5] border-[#f07f19] text-[#f07f19]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>👤 Lez. Individuale</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Docente di Riferimento</label>
                  <select required value={docenteSelezionato} onChange={(e) => setDocenteSelezionato(e.target.value)} className="w-full text-xs px-2.5 py-2 bg-white border border-[#e2dfda] rounded-xl text-gray-800 font-medium">
                    <option value="">— Seleziona chi supervisionava —</option>
                    {docenti.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.nome_pubblico || `${doc.nome} ${doc.cognome}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Note</label>
                  <input type="text" placeholder="Note facoltative" value={noteAllievo} onChange={(e) => setNoteAllievo(e.target.value)} className="w-full text-xs px-2.5 py-2 bg-gray-50 border border-[#e2dfda] rounded-xl" />
                </div>

                <button type="submit" disabled={invioLoading} className="w-full py-2.5 bg-[#f07f19] text-white text-xs font-black uppercase rounded-xl">
                  {invioLoading ? 'Invio in corso...' : 'Invia per Approvazione'}
                </button>
              </form>
            </div>

            {/* STORICO REGISTRAZIONI ALLIEVO */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">📋 Storico Inserimenti</h3>
              <div className="bg-white rounded-xl border border-[#e2dfda] shadow-sm divide-y divide-gray-100 overflow-hidden">
                {librettoOre.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4 text-center">Nessuna ora inserita finora.</p>
                ) : (
                  librettoOre.map(item => (
                    <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-gray-800">
                          {item.tipo_tirocinio === 'corso_gruppo' ? '👥 Gruppo' : '👤 Individuale'} — {item.ore_effettuate} ore
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Data: {new Date(item.data_tirocinio).toLocaleDateString('it-IT')} {item.note_allievo && ` | ${item.note_allievo}`}
                        </p>
                      </div>
                      <div>
                        {item.stato === 'in_attesa' && <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg text-[9px] font-bold uppercase">In attesa ⏳</span>}
                        {item.stato === 'approvato' && <span className="px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-bold uppercase">Confermato ✅</span>}
                        {item.stato === 'rifiutata' && <span className="px-2 py-1 bg-red-50 border border-red-100 text-red-500 rounded-lg text-[9px] font-bold uppercase">Rifiutato ❌</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PANNELLO GESTIONE APPROVAZIONI */}
        {sezioneAttiva === 'approvazioni' && (isDocente || isAdmin) && (
          <div className="space-y-4">
            <header className="space-y-0.5 border-l-4 border-amber-500 pl-3">
              <h1 className="text-base font-black tracking-tight text-[#333333] uppercase">Gestione Approvazioni</h1>
              <p className="text-gray-500 text-[11px]">Spazio autorizzato per la validazione dei dati del centro.</p>
            </header>

            {/* SEZIONE ADMIN: APPROVAZIONE NUOVI ACCOUNT UTENTE */}
            {isAdmin && (
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                  👤 Nuovi Account in Attesa di Attivazione ({accountDaApprovare.length})
                </h3>
                
                {accountDaApprovare.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Nessun nuovo utente da approvare.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {accountDaApprovare.map((acc) => (
                      <div key={acc.id} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-black text-gray-800 uppercase">{acc.nome} {acc.cognome}</p>
                          <p className="text-[10px] text-gray-400">Registrato il: {new Date(acc.created_at).toLocaleDateString('it-IT')}</p>
                        </div>
                        <button 
                          onClick={() => gestisciApprovazioneAccount(acc.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-black text-[9px] uppercase rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          Abilita Account ✅
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPROVAZIONE ORE TIROCINIO IN ATTESA */}
            <div className="bg-white rounded-xl border border-[#e2dfda] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b pb-1">
                👥 Ore Tirocinio in Attesa ({richiesteDaApprovare.length})
              </h3>
              
              {richiesteDaApprovare.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nessuna richiesta di ore in sospeso.</p>
              ) : (
                <div className="space-y-3">
                  {richiesteDaApprovare.map((req) => (
                    <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-gray-800 uppercase">{req.allievo_nome}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Data tirocinio: {new Date(req.data_tirocinio).toLocaleDateString('it-IT')}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-black text-[10px] rounded-lg">{req.ore_effettuate} ore</span>
                      </div>
                      {req.note_allievo && <p className="text-[11px] italic text-gray-500">"{req.note_allievo}"</p>}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button onClick={() => gestisciDecisioneDocente(req.id, 'rifiutata')} className="py-1.5 border border-red-200 text-red-600 text-[10px] font-bold uppercase rounded-lg hover:bg-red-50">Rifiuta ❌</button>
                        <button onClick={() => gestisciDecisioneDocente(req.id, 'approvato')} className="py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-700">Approva ✅</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STORICO GLOBALE DEL CENTRO (SOLO ADMIN) */}
            {isAdmin && (
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md space-y-3">
                <div className="border-b border-slate-700 pb-1.5">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    🛠️ Storico Ore Globale Centro CIAC
                  </h3>
                  <p className="text-[10px] text-slate-400">Monitoraggio globale di tutto il database lezioni.</p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs text-slate-300">
                  {tutteLeRichiesteAdmin.length === 0 ? (
                    <p className="text-center text-slate-500 py-2">Nessun dato memorizzato.</p>
                  ) : (
                    tutteLeRichiesteAdmin.map(item => (
                      <div key={item.id} className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white uppercase text-[11px]">{item.allievo_nome}</p>
                          <p className="text-[10px] text-slate-400">{item.ore_effettuate} ore | Stato: 
                            <span className={`ml-1 font-bold ${item.stato === 'approvato' ? 'text-emerald-400' : item.stato === 'rifiutata' ? 'text-red-400' : 'text-amber-400'}`}>
                              {item.stato.toUpperCase()}
                            </span>
                          </p>
                        </div>
                        {item.stato === 'in_attesa' && (
                          <button onClick={() => gestisciDecisioneDocente(item.id, 'approvato')} className="bg-amber-500 text-slate-900 font-bold text-[9px] px-2 py-1 rounded hover:bg-amber-400 uppercase">
                            Approva Forzato
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}