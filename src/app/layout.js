// src/app/layout.js
import './globals.css'

export const metadata = {
  title: 'CIAC - Centro Istruzione Amici del Cane',
  description: 'Area Formazione e Servizi Cinofili',
  icons: {
    icon: '/logo-ciac.png',
    apple: '/logo-ciac.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-[#f7f5f2] min-h-screen font-sans antialiased text-[#4a4a4a]">
        
        {/* HEADER COMPATTO IN STILE WEB-APP */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#e2dfda] px-4 py-2.5 shadow-sm">
          <div className="max-w-md mx-auto flex items-center justify-between">
            
            {/* A SINISTRA: SOLO IL LOGO IMMAGINE */}
            <a href="/" className="flex items-center active:scale-95 transition-transform">
              <img 
                src="/logo.png" 
                alt="🐾" 
                className="h-9 w-auto object-contain object-left max-w-[120px]"
              />
            </a>
            
            {/* A DESTRA: PULSANTI COORDINATI IN ARANCIONE CIAC */}
            <div className="flex items-center gap-2">
              <a 
                href="/login" 
                className="px-2.5 py-1.5 border border-[#e2dfda] text-[#4a4a4a] hover:text-[#f07f19] hover:border-[#f07f19] font-black text-[10px] rounded-xl uppercase tracking-wider transition-colors bg-[#fcfbfa]"
              >
                Area Riservata
              </a>
              <a 
                href="https://www.ciac-varese.it" 
                target="_blank" 
                rel="noreferrer" 
                className="px-2.5 py-1.5 bg-[#f07f19] hover:bg-[#d66f11] text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1"
              >
                www.ciac-varese.it ↗
              </a>
            </div>

          </div>
        </header>

        {/* CONTENUTO DELLE PAGINE */}
        <main>
          {children}
        </main>

      </body>
    </html>
  )
}