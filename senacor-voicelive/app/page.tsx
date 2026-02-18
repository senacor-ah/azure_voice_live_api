import { verifySession } from '@/app/lib/dal'
import { AvatarLaunchButton } from '@/app/components/AvatarLaunchButton'
import { StickyHeader } from '@/app/components/StickyHeader'

export default async function Home() {
  const session = await verifySession()

  return (
    <div className="min-h-screen bg-[#e8e8e8] font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <StickyHeader userName={session.name} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center">

        {/* Background subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e8e8] via-[#ebebeb] to-[#dcdcdc]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left – Text */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900 mb-6">
                Banking<br />
                <span className="text-gray-500">leicht</span><br />
                gemacht
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-sm">
                Verwalten Sie Ihre Finanzen einfacher als je zuvor – mit intelligenter KI-Unterstützung.
              </p>
              <div className="flex items-center gap-4">
                <button className="bg-gray-900 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-gray-700 transition-colors shadow-lg">
                  Jetzt starten
                </button>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors underline underline-offset-4">
                  Mehr erfahren
                </a>
              </div>

              {/* Stats row */}
              <div className="flex gap-10 mt-16 pt-8 border-t border-gray-300">
                <div>
                  <p className="text-3xl font-black text-gray-900">98%</p>
                  <p className="text-xs text-gray-500 mt-1">Kundenzufriedenheit</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900">2M+</p>
                  <p className="text-xs text-gray-500 mt-1">Aktive Nutzer</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900">€ 4B</p>
                  <p className="text-xs text-gray-500 mt-1">Verwaltetes Vermögen</p>
                </div>
              </div>
            </div>

            {/* Right – Floating UI Cards */}
            <div className="relative h-[520px] hidden lg:block">

              {/* Card 1 – Expenses */}
              <div className="absolute top-8 left-0 bg-white rounded-3xl shadow-xl p-6 w-64">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor:'#e8f0f8'}}>
                    <svg className="w-4 h-4" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Ausgaben</span>
                </div>
                {/* Donut chart placeholder */}
                <div className="relative flex justify-center mb-4">
                  <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#7da0d7" strokeWidth="14"
                      strokeDasharray="75 113" strokeLinecap="round" />
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#b3cce8" strokeWidth="14"
                      strokeDasharray="45 113" strokeDashoffset="-75" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">Juli</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:'#7da0d7'}} />
                    Studium
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:'#b3cce8'}} />
                    Reisen
                  </div>
                </div>
              </div>

              {/* Card 2 – Investments */}
              <div className="absolute top-0 right-0 bg-white rounded-3xl shadow-xl p-6 w-56">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500">Ihre Investments</span>
                </div>
                {/* Sparkline */}
                <svg viewBox="0 0 120 50" className="w-full my-3" fill="none">
                  <path d="M0 40 C20 38 30 25 50 20 C70 15 80 28 100 15 C110 10 115 8 120 5"
                    stroke="#7da0d7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <p className="text-2xl font-black text-gray-900">+ 3.562 €</p>
                <p className="text-xs text-gray-400 mt-0.5">Gewinn in 3 Monaten</p>
              </div>

              {/* Card 3 – Account Balance */}
              <div className="absolute bottom-16 right-4 bg-gray-900 text-white rounded-3xl shadow-xl p-5 w-52">
                <p className="text-xs text-gray-400 mb-1">Kontostand</p>
                <p className="text-2xl font-black">12.840 €</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Letzte Transaktion</p>
                    <p className="text-sm font-semibold text-green-400 mt-0.5">+ 1.200 €</p>
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{backgroundColor:'#7da0d7'}}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4 – Quick Action */}
              <div className="absolute bottom-0 left-12 bg-white rounded-3xl shadow-xl p-4 flex items-center gap-3 w-56">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:'#7da0d7'}}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Überweisung</p>
                  <p className="text-sm font-semibold text-gray-900">Sofort senden</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
                title: 'Maximale Sicherheit',
                desc: 'Modernste Verschlüsselung schützt Ihre Daten rund um die Uhr.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                title: 'Blitzschnell',
                desc: 'Transaktionen und Anfragen werden in Echtzeit verarbeitet.',
              },
              {
                icon: (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.332 2.798H4.13c-1.361 0-2.332-1.798-1.332-2.798L4.2 15.3" />
                  </>
                ),
                title: 'KI-Beratung',
                desc: 'Ihr persönlicher KI-Assistent steht Ihnen jederzeit zur Verfügung.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{backgroundColor:'#e8f0f8'}}>
                  <svg className="w-6 h-6" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNSERE PRODUKTE ── */}
      <section className="py-24 bg-[#e8e8e8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{color:'#7da0d7'}}>Produktwelt</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Unsere Produkte</h2>
            <p className="text-lg text-gray-500 max-w-xl">
              Von der smarten Girokontoführung bis zur KI-gestützten Finanzberatung –
              die Senacor Bank begleitet Sie in allen Lebenslagen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product 1 */}
            <div className="bg-white rounded-3xl p-8 group hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{backgroundColor:'#e8f0f8'}}>
                <svg className="w-6 h-6" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Senacor Girokonto</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Ihr flexibles Alltagskonto – kostenlos, digital und immer griffbereit.
                Mit integrierter Ausgabenanalyse und sofortigen Push-Benachrichtigungen.
              </p>
              <a href="#" className="text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all" style={{color:'#7da0d7'}}>
                Mehr erfahren
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Product 2 */}
            <div className="bg-gray-900 rounded-3xl p-8 group hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{backgroundColor:'rgba(125,160,215,0.2)'}}>
                <svg className="w-6 h-6" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-3">SenacorCredit</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Einfach entspannt finanzieren – mit fairen Konditionen, transparenter
                Ratenzahlung und sofortiger Online-Entscheidung.
              </p>
              <a href="#" className="text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all" style={{color:'#7da0d7'}}>
                Mehr erfahren
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Product 3 */}
            <div className="bg-white rounded-3xl p-8 group hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{backgroundColor:'#e8f0f8'}}>
                <svg className="w-6 h-6" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Senacor Invest</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Ihr Vermögen intelligent wachsen lassen. ETF-Sparpläne, Aktienhandel
                und KI-gestützte Anlageempfehlungen – alles in einer App.
              </p>
              <a href="#" className="text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all" style={{color:'#7da0d7'}}>
                Mehr erfahren
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Product 4 */}
            <div className="bg-white rounded-3xl p-8 group hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{backgroundColor:'#e8f0f8'}}>
                <svg className="w-6 h-6" style={{color:'#7da0d7'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.332 2.798H4.13c-1.361 0-2.332-1.798-1.332-2.798L4.2 15.3" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">KI-Finanzberatung</h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Ihr persönlicher KI-Avatar berät Sie rund um die Uhr –
                per Sprache, jederzeit erreichbar und immer auf dem neuesten Stand.
              </p>
              <a href="#" className="text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all" style={{color:'#7da0d7'}}>
                Mehr erfahren
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── KOMPETENZEN ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{color:'#7da0d7'}}>Was uns antreibt</p>
              <h2 className="text-4xl font-black text-gray-900 mb-6">Unsere Kompetenzen</h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Wir verbinden modernste Technologie mit tiefem Finanz-Know-how –
                für eine Bank, die wirklich zu Ihrem Leben passt.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Liquiditätsbegleitung', desc: 'Immer die passende Lösung für Ihre finanzielle Flexibilität.' },
                { title: 'Kundenzentrierung', desc: 'Sie stehen im Mittelpunkt – bei jedem Produkt, jedem Service.' },
                { title: 'Risikomanagement', desc: 'Modernste Datenanalyse für sichere und fundierte Entscheidungen.' },
                { title: 'Digital Excellence', desc: 'Beste digitale Erfahrungen auf allen Kanälen und Geräten.' },
                { title: 'Embedded Finance', desc: 'Banking nahtlos eingebettet in Ihren Alltag und Ihre Apps.' },
                { title: 'KI & Innovation', desc: 'KI-Lösungen, die Banking einfacher, schneller und smarter machen.' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-[#f5f7fa] rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="w-2 h-2 rounded-full mb-3" style={{backgroundColor:'#7da0d7'}} />
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WIR SIND EIN TEAM ── */}
      <section className="py-24 bg-[#e8e8e8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image placeholder */}
            <div className="relative h-80 bg-gray-900 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="flex -space-x-4 mb-6">
                  {['S','A','M','K','L'].map((l) => (
                    <div key={l} className="w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center text-sm font-bold text-white"
                      style={{backgroundColor:'#7da0d7'}}>
                      {l}
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    +200
                  </div>
                </div>
                <p className="text-white font-black text-2xl">Wir sind Senacor Bank.</p>
                <p className="text-gray-400 text-sm mt-2">Menschen mit Leidenschaft für die Bank der Zukunft.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{color:'#7da0d7'}}>Unser Team</p>
              <h2 className="text-4xl font-black text-gray-900 mb-6">
                Wir sind ein Team.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                Hinter der Senacor Bank stehen Menschen mit Leidenschaft, Kreativität
                und dem Willen, Banking neu zu gestalten. Werden Sie Teil unserer Mission.
              </p>
              <div className="flex gap-4">
                <button className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-gray-700 transition-colors">
                  Karriere entdecken
                </button>
                <button className="border border-gray-300 text-gray-700 text-sm font-semibold px-6 py-3 rounded-full hover:border-gray-500 transition-colors">
                  Über uns
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AKTUELLE THEMEN ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{color:'#7da0d7'}}>Neuigkeiten</p>
              <h2 className="text-4xl font-black text-gray-900">Aktuelle Themen</h2>
            </div>
            <a href="#" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Alle Themen
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: 'Auszeichnung',
                tagColor: '#7da0d7',
                title: 'Senacor Bank zweifach ausgezeichnet',
                desc: 'Wir freuen uns über die Auszeichnung als „Fairster Digitalkredit" und das BankingCheck-Siegel als beste Direktbank 2025.',
                date: 'Januar 2026',
              },
              {
                tag: 'Innovation',
                tagColor: '#5a82bf',
                title: 'KI-Avatar Beratung geht live',
                desc: 'Ab sofort können alle Kundinnen und Kunden unsere neue KI-Sprachberatung nutzen – rund um die Uhr, ohne Wartezeit.',
                date: 'Februar 2026',
              },
              {
                tag: 'Geschäftsbericht',
                tagColor: '#3d6499',
                title: 'Geschäftsbericht 2025',
                desc: 'Im Geschäftsbericht 2025 finden sich die wichtigsten Zahlen, Highlights des Geschäftsjahres sowie ein Grußwort des Vorstands.',
                date: 'März 2026',
              },
            ].map(({ tag, tagColor, title, desc, date }) => (
              <a key={title} href="#" className="group block bg-[#f5f7fa] rounded-3xl p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{backgroundColor: tagColor}}>
                    {tag}
                  </span>
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-3 leading-snug">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{desc}</p>
                <span className="text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all" style={{color:'#7da0d7'}}>
                  Mehr erfahren
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-black text-white">senacor<span style={{color:'#7da0d7'}}>.bank</span></span>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Wir gestalten die Bank der Zukunft – digital, fair und immer nah am Menschen.
              </p>
            </div>
            {[
              { heading: 'Produkte', links: ['Girokonto', 'SenacorCredit', 'Senacor Invest', 'KI-Beratung'] },
              { heading: 'Unternehmen', links: ['Über uns', 'Nachhaltigkeit', 'Presse', 'Karriere'] },
              { heading: 'Service', links: ['Kontakt', 'FAQ', 'Sicherheit', 'Datenschutz'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h5 className="text-white font-bold text-sm mb-4">{heading}</h5>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2026 Senacor Bank AG. Alle Rechte vorbehalten.</p>
            <div className="flex gap-6">
              {['Impressum', 'Datenschutz', 'AGB', 'Barrierefreiheit'].map((l) => (
                <a key={l} href="#" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING AI AVATAR BUTTON ── */}
      <AvatarLaunchButton />
    </div>
  )
}
