import { verifySession } from '@/app/lib/dal'
import { StickyHeader } from '@/app/components/StickyHeader'

export const metadata = {
  title: 'Online Banking – Senacor Bank',
  description: 'Ihre persönliche Finanzübersicht – Konten, Transaktionen und Sparziele auf einen Blick.',
}

/* ── Mock data ──────────────────────────────────────────────── */

const accounts = [
  { id: 'giro', label: 'Girokonto', iban: 'DE89 3704 0044 0532 0130 00', balance: 12_847.56, currency: '€', change: +2.4 },
  { id: 'tages', label: 'Tagesgeldkonto', iban: 'DE47 3704 0044 0710 0400 00', balance: 35_210.00, currency: '€', change: +0.8 },
  { id: 'depot', label: 'Wertpapierdepot', iban: 'DE12 3704 0044 0812 3456 00', balance: 78_430.12, currency: '€', change: -1.2 },
]

const savingsGoals = [
  { id: 1, label: 'Urlaub 2026', target: 5_000, current: 3_750, icon: '✈️', color: '#7da0d7' },
  { id: 2, label: 'Neues Auto', target: 25_000, current: 14_500, icon: '🚗', color: '#6366f1' },
  { id: 3, label: 'Notgroschen', target: 10_000, current: 8_200, icon: '🛡️', color: '#22c55e' },
  { id: 4, label: 'Renovierung', target: 15_000, current: 4_200, icon: '🏠', color: '#f59e0b' },
]

const transactions = [
  { id: 1, date: '21. Feb 2026', description: 'REWE Supermarkt', category: 'Lebensmittel', amount: -67.42, icon: '🛒' },
  { id: 2, date: '20. Feb 2026', description: 'Gehalt – Senacor GmbH', category: 'Einkommen', amount: +4_850.00, icon: '💼' },
  { id: 3, date: '19. Feb 2026', description: 'Netflix Abo', category: 'Unterhaltung', amount: -17.99, icon: '🎬' },
  { id: 4, date: '18. Feb 2026', description: 'Amazon Marketplace', category: 'Shopping', amount: -129.90, icon: '📦' },
  { id: 5, date: '18. Feb 2026', description: 'Shell Tankstelle', category: 'Mobilität', amount: -72.30, icon: '⛽' },
  { id: 6, date: '17. Feb 2026', description: 'Miete Februar', category: 'Wohnen', amount: -1_150.00, icon: '🏠' },
  { id: 7, date: '16. Feb 2026', description: 'Stadtwerke Strom', category: 'Nebenkosten', amount: -89.00, icon: '⚡' },
  { id: 8, date: '15. Feb 2026', description: 'Zinsgutschrift Tagesgeld', category: 'Zinsen', amount: +23.45, icon: '📈' },
  { id: 9, date: '14. Feb 2026', description: 'Rossmann Drogerie', category: 'Drogerie', amount: -34.80, icon: '🧴' },
  { id: 10, date: '13. Feb 2026', description: 'Überweisung an Max M.', category: 'Überweisung', amount: -200.00, icon: '↗️' },
]

const cards = [
  { id: 1, type: 'Visa Debit', last4: '4821', expires: '09/28', limit: 5_000, spent: 1_230, color: 'from-gray-800 to-gray-900' },
  { id: 2, type: 'Mastercard Gold', last4: '7193', expires: '03/27', limit: 10_000, spent: 3_475, color: 'from-amber-600 to-amber-800' },
]

const monthlySpending = [
  { category: 'Wohnen', amount: 1_150, percent: 38, color: '#7da0d7' },
  { category: 'Lebensmittel', amount: 420, percent: 14, color: '#6366f1' },
  { category: 'Mobilität', amount: 310, percent: 10, color: '#22c55e' },
  { category: 'Shopping', amount: 290, percent: 10, color: '#f59e0b' },
  { category: 'Unterhaltung', amount: 180, percent: 6, color: '#ef4444' },
  { category: 'Sonstiges', amount: 650, percent: 22, color: '#94a3b8' },
]

/* ── Helper components ──────────────────────────────────────── */

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function ProgressRing({ percent, color, size = 80, stroke = 8 }: { percent: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  )
}

/* ── Main page ──────────────────────────────────────────────── */

export default async function BankingPage() {
  const session = await verifySession()
  const firstName = session.name?.split(' ')[0] ?? 'Kunde'

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans">
      <StickyHeader userName={session.name} variant="solid" />

      {/* ── Welcome / Balance Hero ── */}
      <section className="pt-28 pb-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500 text-sm mb-1">Willkommen zurück,</p>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-1">{firstName}</h1>
          <p className="text-gray-400 text-sm">Letzte Anmeldung: 22. Februar 2026, 09:14 Uhr</p>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { label: 'Überweisung', icon: '↗️' },
              { label: 'Dauerauftrag', icon: '🔁' },
              { label: 'Kartenverwaltung', icon: '💳' },
              { label: 'Dokumente', icon: '📄' },
            ].map((a) => (
              <button
                key={a.label}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-[#7da0d7] hover:text-[#7da0d7] transition-colors shadow-sm"
              >
                <span>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Account cards ── */}
      <section className="px-6 lg:px-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{acc.label}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{acc.iban}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    acc.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {acc.change >= 0 ? '+' : ''}{acc.change}%
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 bg-gray-900 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-sm text-gray-400">Gesamtvermögen</p>
              <p className="text-3xl font-black text-white">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-emerald-400 font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              +1.8% ggü. Vormonat
            </div>
          </div>
        </div>
      </section>

      {/* ── Savings Goals + Spending ── */}
      <section className="px-6 lg:px-12 pb-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6">

          {/* Savings Goals – 3 cols */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Sparziele</h2>
              <button className="text-sm text-[#7da0d7] font-semibold hover:underline">+ Neues Ziel</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {savingsGoals.map((g) => {
                const pct = Math.round((g.current / g.target) * 100)
                return (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="relative shrink-0">
                      <ProgressRing percent={pct} color={g.color} />
                      <span className="absolute inset-0 flex items-center justify-center text-xl">{g.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{g.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(g.current)} von {formatCurrency(g.target)}</p>
                      <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 text-right font-semibold">{pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Monthly Spending Breakdown – 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Ausgaben Februar</h2>
              <span className="text-sm text-gray-400 font-medium">Gesamt: {formatCurrency(3_000)}</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {/* Donut chart */}
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
                  {(() => {
                    let offset = 0
                    const r = 48
                    const circ = 2 * Math.PI * r
                    return monthlySpending.map((s) => {
                      const dash = (s.percent / 100) * circ
                      const el = (
                        <circle
                          key={s.category}
                          cx="60" cy="60" r={r}
                          fill="none" stroke={s.color} strokeWidth="20"
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset}
                        />
                      )
                      offset += dash
                      return el
                    })
                  })()}
                </svg>
              </div>
              {/* Legend */}
              <div className="space-y-3">
                {monthlySpending.map((s) => (
                  <div key={s.category} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-gray-600 flex-1">{s.category}</span>
                    <span className="text-sm font-semibold text-gray-800">{formatCurrency(s.amount)}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{s.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Credit Cards ── */}
      <section className="px-6 lg:px-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ihre Karten</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((card) => {
              const usedPct = Math.round((card.spent / card.limit) * 100)
              return (
                <div key={card.id} className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-sm font-semibold opacity-90">{card.type}</span>
                    <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="1" y="4" width="22" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="1" y="8" width="22" height="3" fill="currentColor" opacity="0.3" />
                    </svg>
                  </div>
                  <p className="text-lg font-mono tracking-widest mb-6">•••• •••• •••• {card.last4}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Gültig bis</p>
                      <p className="text-sm font-semibold">{card.expires}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Verfügbar</p>
                      <p className="text-sm font-semibold">{formatCurrency(card.limit - card.spent)}</p>
                    </div>
                  </div>
                  {/* Spending bar */}
                  <div className="mt-4">
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{ width: `${usedPct}%` }} />
                    </div>
                    <p className="text-[10px] opacity-60 mt-1">{formatCurrency(card.spent)} von {formatCurrency(card.limit)} genutzt</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Transactions ── */}
      <section className="px-6 lg:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Letzte Transaktionen</h2>
            <button className="text-sm text-[#7da0d7] font-semibold hover:underline">Alle anzeigen →</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                  i < transactions.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${
                  tx.amount >= 0 ? 'text-emerald-600' : 'text-gray-900'
                }`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span>© 2026 Senacor Bank · Alle Rechte vorbehalten</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">Impressum</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Hilfe & Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
