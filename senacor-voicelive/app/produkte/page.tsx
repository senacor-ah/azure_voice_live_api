import { verifySession } from '@/app/lib/dal'
import { StickyHeader } from '@/app/components/StickyHeader'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────── */
/*  Preis- & Leistungsverzeichnis – Produktseite                 */
/*  Datenquelle: preisleistung.md (Stand 15. Januar 2026)        */
/* ────────────────────────────────────────────────────────────── */

export const metadata = {
  title: 'Preise & Leistungen – Senacor Bank',
  description: 'Unser vollständiges Preis- und Leistungsverzeichnis mit allen Konditionen für Konten, Karten, Wertpapiere und mehr.',
}

/* ── tiny helper components ─────────────────────────────────── */

function SectionHeading({ id, label, title, description }: {
  id: string; label: string; title: string; description?: string
}) {
  return (
    <div id={id} className="scroll-mt-28 mb-10">
      <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#7da0d7' }}>{label}</p>
      <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">{title}</h2>
      {description && <p className="text-lg text-gray-500 max-w-2xl">{description}</p>}
    </div>
  )
}

function PriceRow({ label, price, note, indent }: {
  label: string; price: string; note?: string; indent?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 ${indent ? 'pl-6' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700">{label}</span>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap shrink-0">{price}</span>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#7da0d7' }} />
        {title}
      </h4>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {children}
      </div>
    </div>
  )
}

function ProductCard({ title, price, period, features, highlight }: {
  title: string; price: string; period: string; features: string[]; highlight?: boolean
}) {
  return (
    <div className={`rounded-3xl p-7 flex flex-col ${highlight ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
      <h4 className={`text-lg font-black mb-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
      <div className="flex items-baseline gap-1 mb-5">
        <span className={`text-3xl font-black ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        <span className={`text-sm ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>/ {period}</span>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7da0d7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className={highlight ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── navigation anchors ─────────────────────────────────────── */

const categories = [
  { id: 'konten', label: 'Persönliche Konten' },
  { id: 'spareinlagen', label: 'Sicht- & Spareinlagen' },
  { id: 'sorten', label: 'Sorten & Edelmetalle' },
  { id: 'schliessfaecher', label: 'Schließfächer' },
  { id: 'bargeld', label: 'Bargeld' },
  { id: 'ueberweisungen', label: 'Überweisungen' },
  { id: 'lastschriften', label: 'Lastschriften' },
  { id: 'karten', label: 'Karten' },
  { id: 'wertpapiere', label: 'Wertpapiere' },
  { id: 'kredit', label: 'Kreditgeschäft' },
]

/* ── main page ──────────────────────────────────────────────── */

export default async function ProduktePage() {
  const session = await verifySession()

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-sans">
      <StickyHeader userName={session.name} />

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 bg-gradient-to-br from-[#e8e8e8] via-[#ebebeb] to-[#dcdcdc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Startseite
          </Link>
          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-4">
            Preise &<br />
            <span className="text-gray-500">Leistungen</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mb-10">
            Unser vollständiges Preis- und Leistungsverzeichnis – transparent, fair und übersichtlich.
            Stand 15. Januar 2026.
          </p>

          {/* Category quick-nav */}
          <div className="flex flex-wrap gap-2">
            {categories.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white/80 text-gray-700 hover:bg-white hover:shadow transition-all"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-24">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* A-I  PERSÖNLICHE KONTEN                                */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="konten"
            label="Kontoführung"
            title="Persönliche Konten"
            description="Unsere Kontomodelle im Überblick – vom kostenlosen Startkonto bis zum umfangreichen Premiumpaket."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            <ProductCard
              title="PremiumKonto"
              price="12,90 €"
              period="Monat"
              features={[
                'Sämtliche Buchungsposten inklusive',
                'senacor.bank Girocard für bis zu 2 Berechtigte',
                'Cash-Group-Geldautomaten & Schalter',
                'Bis zu 2 Mastercard + 2 Visa Karten inklusive',
                'SEPA-Daueraufträge & Echtzeitüberweisungen',
                'Online Banking mit photoTAN',
              ]}
              highlight
            />
            <ProductCard
              title="KlassikKonto"
              price="9,90 €"
              period="Monat"
              features={[
                'Sämtliche Buchungsposten inklusive',
                'senacor.bank Girocard für bis zu 2 Berechtigte',
                'Cash-Group-Geldautomaten & Schalter',
                'Mastercard Debit für bis zu 2 Berechtigte',
                'SEPA-Daueraufträge & Echtzeitüberweisungen',
                'Online Banking mit photoTAN',
              ]}
            />
            <ProductCard
              title="GiroKonto"
              price="4,90 €"
              period="Monat"
              features={[
                'Ab 50.000 € Vermögen: 0,00 € / Monat',
                'Sämtliche Buchungsposten inklusive',
                'senacor.bank Girocard + Virtual Debit Card',
                'Cash-Group-Geldautomaten',
                'Online Banking mit photoTAN',
                'Beleghaft: 3,90 € / Überweisung',
              ]}
            />
            <ProductCard
              title="StartKonto"
              price="0,00 €"
              period="Monat"
              features={[
                'Für 7–27 Jahre (Schüler, Studenten, Azubis…)',
                'Ab 28. Geburtstag: 9,90 € / Monat',
                'Young Visa Kreditkarte + Girocard',
                'Cash-Group-Geldautomaten',
                'Online Banking mit photoTAN',
                'Beleghaft: 2,50 € / Überweisung',
              ]}
            />
            <ProductCard
              title="BasisKonto"
              price="6,90 €"
              period="Monat"
              features={[
                'Sämtliche Buchungsposten inklusive',
                'senacor.bank Girocard für bis zu 2 Berechtigte',
                'Cash-Group-Geldautomaten & Schalter',
                'SEPA-Daueraufträge inklusive',
                'Online Banking & beleglose Überweisungen',
                'Beleghaft: 1,50 € / Überweisung',
              ]}
            />
          </div>

          <SubSection title="Kontoauszüge">
            <PriceRow label="Aufbewahrung zur Abholung (Postabholer)" price="1,50 € / Auszug" note="Kein Neuabschluss möglich" />
            <PriceRow label="Tages- und Wochenauszug (papierhafte Übermittlung)" price="0,14 € / Auszug" note="Wenn statt Postfach / Drucker gewünscht (außer GiroKonto)" />
            <PriceRow label="Monatsauszug (papierhafte Übermittlung)" price="0,51 € / Auszug" note="Wenn statt Postfach / Drucker gewünscht (außer GiroKonto)" />
            <PriceRow label="Nacherstellung Kontoauszüge (bis zu 1 Monat)" price="3,00 € / Auszug" note="Wenn Bank Informationspflichten bereits erfüllt hat" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* A-II  SICHT- UND SPAREINLAGEN                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="spareinlagen"
            label="Einlagen"
            title="Sicht- & Spareinlagen"
            description="Tagesgeld, Festgeld und Sparkonten – flexibel und sicher."
          />

          <SubSection title="TagesgeldKonto / Topzinskonto Plus / TagesgeldKonto Plus">
            <PriceRow label="Kontoauszug – Aufbewahrung zur Abholung (Postabholer)" price="1,50 €" note="Kein Neuabschluss möglich" />
            <PriceRow label="Papierhafter Tagesauszug (inkl. Porto)" price="0,90 €" />
            <PriceRow label="Papierhafter Monatsauszug (inkl. Porto)" price="0,90 €" />
          </SubSection>

          <SubSection title="Verrechnungskonto Plus">
            <PriceRow label="Monatspauschale" price="1,90 €" />
            <PriceRow label="Kontoauszug bei postalischem Versand (zzgl. Porto)" price="0,51 € / Auszug" />
          </SubSection>

          <SubSection title="Sparkonten (3-monatige Kündigungsfrist)">
            <PriceRow label="Aufbewahrung eines Sparbuches" price="75,00 € / Jahr" note="Kein Neuabschluss möglich, nicht bei Kreditsicherheit" />
          </SubSection>

          <SubSection title="Mietkautionskonto">
            <PriceRow label="Einmaliges Bearbeitungsentgelt – Mieter" price="59,00 €" note="Bei Eröffnung ab 01.09.2021" />
            <PriceRow label="Einmaliges Bearbeitungsentgelt – Vermieter" price="59,00 €" note="Bei Eröffnung ab 01.09.2021" />
            <PriceRow label="Papierhafter Jahresauszug (inkl. Porto)" price="0,94 €" />
            <PriceRow label="Papierhafter Monatsauszug (inkl. Porto)" price="1,35 €" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* A-III  SORTEN & EDELMETALLE                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="sorten"
            label="Devisen"
            title="Sorten & Edelmetalle"
            description="Fremdwährungen und Edelmetalle – Ab- und Verkauf in Filialen mit Kassenservice."
          />

          <SubSection title="Sorten (Fremdwährungen)">
            <PriceRow label="Abwicklungskosten An- und Verkauf" price="0,00 €" />
            <PriceRow label="Versand an Lieferadresse (dt. Festland, bis 5.000 €)" price="7,90 € Transportkosten" />
            <PriceRow label="Ankauf DM" price="Fester Kurs 1,95583" />
          </SubSection>

          <SubSection title="Edelmetalle">
            <PriceRow label="Abwicklungskosten An- und Verkauf" price="12,60 € / Transaktion" />
            <PriceRow label="Versand an Lieferadresse (dt. Festland, bis 5.000 €)" price="7,90 € Transportkosten" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* A-IV  BANKSCHLIESSFÄCHER                               */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="schliessfaecher"
            label="Verwahrung"
            title="Bankschließfächer"
            description="Sichere Aufbewahrung Ihrer Wertgegenstände in verschiedenen Größen."
          />

          <SubSection title="Schließfachgrößen & Jahrespreise">
            <PriceRow label="Größe S – bis 8.000 ccm" price="119,00 € / Jahr" />
            <PriceRow label="Größe M – bis 15.000 ccm" price="179,00 € / Jahr" />
            <PriceRow label="Größe L – bis 20.000 ccm" price="239,00 € / Jahr" />
            <PriceRow label="Größe XL – bis 50.000 ccm" price="379,00 € / Jahr" />
            <PriceRow label="Größe XXL – über 50.000 ccm" price="589,00 € / Jahr" />
          </SubSection>

          <SubSection title="Verwahrstücke">
            <PriceRow label="Aufbewahrung sperrige Einzelstücke (Minimum)" price="ab 199,00 € / Jahr" note="Kein Neuabschluss, nur Bestandsgeschäft" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* B-I  BARGELD                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="bargeld"
            label="Zahlungsdienste"
            title="Bargeldauszahlungen & -einzahlungen"
            description="Transparente Konditionen für Bargeldtransaktionen am Schalter und am Automaten."
          />

          <SubSection title="Bargeldauszahlungen & -einzahlungen am Schalter">
            <PriceRow label="Zulasten/zugunsten eigener Zahlungsverkehrskonten" price="2,50 € / Vorgang" note="Ausnahmen: PremiumKonto, PremiumGeschäftskonto, GiroKonto u.a." />
          </SubSection>

          <SubSection title="Bargeldauszahlungen am Geldautomaten – eigene Kunden bei senacor.bank">
            <PriceRow label="ClassicKreditkarte / GoldKreditkarte / Prepaid / Young Visa" price="1,95 % (min. 5,98 €)" />
            <PriceRow label="PremiumKreditkarte" price="1,95 % (min. 5,98 €)" note="12 kostenlose Auszahlungen p.a. Inland, 25 Ausland" />
            <PriceRow label="Mastercard Debit / Virtual Debit Card" price="1,95 % (min. 5,98 €)" />
          </SubSection>

          <SubSection title="Bargeldauszahlungen am Geldautomaten – bei fremden KI/ZDL">
            <PriceRow label="Girocard / SparCard bei Cash Group" price="0,00 €" />
            <PriceRow label="Girocard bei sonstigen KI/ZDL (kein direktes Entgelt)" price="1 % (min. 5,98 €)" />
            <PriceRow label="Mastercard Debit / Virtual Debit Card" price="1,95 % (min. 5,98 €)" note="Zzgl. 1,5 % Auslandseinsatzentgelt außerhalb Euroland" />
            <PriceRow label="Kreditkarten (Classic / Gold / Prepaid / Young Visa)" price="1,95 % (min. 5,98 €)" note="Zzgl. 1,75 % Auslandseinsatzentgelt außerhalb Euroland" />
            <PriceRow label="EWR-Währungsumrechnungsentgelt" price="+ 0,59 %" note="Auf den Euro-Referenzwechselkurs der EZB" />
          </SubSection>

          <SubSection title="Bargeldauszahlungslimite – Kreditkarten (Tageslimit)">
            <PriceRow label="PremiumKreditkarte" price="1.000 € / Tag" note="2.000 € / Woche · 6.000 € / Monat" />
            <PriceRow label="GoldKreditkarte" price="1.000 € / Tag" note="2.000 € / Woche · 6.000 € / Monat" />
            <PriceRow label="ClassicKreditkarte / Prepaid" price="600 € / Tag" note="2.000 € / Woche · 4.000 € / Monat" />
            <PriceRow label="Young Visa / Prepaid Junior" price="300 € / Tag" note="300 € / Woche · 1.000 € / Monat" />
          </SubSection>

          <SubSection title="Bargeldauszahlungslimite – Debitkarten">
            <PriceRow label="senacor.bank Girocard" price="2.000 € / Tag" note="2.000 € / Woche · 500 € Ausland/Tag" />
            <PriceRow label="Mastercard Debit / Virtual Debit Card" price="600 € / Tag" note="2.000 € / Woche" />
          </SubSection>

          <SubSection title="Sonstiges">
            <PriceRow label="Bargeldeinzahlung mit SafeBag" price="7,50 € / Stück" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* B-II  ÜBERWEISUNGEN                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="ueberweisungen"
            label="Zahlungsverkehr"
            title="Überweisungen & Daueraufträge"
            description="SEPA, Ausland und Eilüberweisungen – alle Konditionen auf einen Blick."
          />

          <SubSection title="SEPA-Überweisungen / Echtzeitüberweisungen">
            <PriceRow label="Telefonische / formlose Überweisung (z.B. mündlich, Fax)" price="6,00 € / Überweisung" />
            <PriceRow label="Ausführungsbestätigung / -anzeige" price="11,00 € / Überweisung" />
            <PriceRow label="Eilüberweisung (nur Inland)" price="10,35 € zzgl. fremder Kosten" />
            <PriceRow label="Ermittlung Sachverhalt (Nicht-Verbraucher)" price="25,00 € / Überweisungsvorgang" />
            <PriceRow label="Widerruf nach Zugang" price="11,00 € / Überweisung" />
            <PriceRow label="Ablehnung wegen fehlender Deckung / Angaben" price="1,90 €" />
          </SubSection>

          <SubSection title="Inlands- / EWR-Überweisungen (außer SEPA)">
            <PriceRow label="Standardabwicklungsentgelt" price="2,50 € / Überweisung" />
            <PriceRow label="SHARE – Beträge unter 250 €" price="10,00 €" />
            <PriceRow label="SHARE – Beträge ab 250 €" price="1,5 ‰ (min. 12,50 €)" />
            <PriceRow label="Eilüberweisung" price="15,00 € zzgl. fremder Kosten" />
            <PriceRow label="Währungsumrechnung unter 12.500 €" price="7,50 €" />
            <PriceRow label="Währungsumrechnung ab 12.500 €" price="1,0 ‰" />
            <PriceRow label="Rückruf einer Überweisung" price="25,00 €" />
          </SubSection>

          <SubSection title="SEPA-Dauerauftrag">
            <PriceRow label="Einrichtung" price="1,53 €" note="Ausgenommen Daueraufträge zugunsten eigener Konten" />
            <PriceRow label="Ausführung" price="0,26 €" />
            <PriceRow label="Änderung / Aussetzung (Nicht-Verbraucher)" price="1,53 €" />
            <PriceRow label="Rückruf" price="11,00 €" />
          </SubSection>

          <SubSection title="Auslandsdauerauftrag">
            <PriceRow label="Einrichtung" price="5,00 €" />
            <PriceRow label="Änderung / Aussetzung (Nicht-Verbraucher)" price="5,00 €" />
            <PriceRow label="Rückruf" price="25,00 €" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* B-IV  LASTSCHRIFTEN                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="lastschriften"
            label="Einzugsverfahren"
            title="Lastschriften"
            description="Konditionen für Basis-, Firmen- und kartenbasierte Lastschriften."
          />

          <SubSection title="Kartenbasierter Lastschrifteinzug & SEPA-Basislastschrift">
            <PriceRow label="Rückbelastung an den Einreicher" price="⅓ % (min. 5,11 €)" note="Zzgl. fremder Entgelte" />
          </SubSection>

          <SubSection title="SEPA-Firmenlastschrift">
            <PriceRow label="Vormerkung SEPA-Mandat" price="10,00 € / Kalenderjahr" />
            <PriceRow label="Rückbelastung an den Einreicher" price="⅓ % (min. 5,11 €)" note="Zzgl. fremder Entgelte" />
          </SubSection>

          <SubSection title="Sonstige Entgelte">
            <PriceRow label="Begrenzung / Nichtzulassung SEPA-Basislastschriften (Nicht-Verbraucher)" price="5,00 € einmalig" />
            <PriceRow label="Ablehnung wegen fehlender Kontodeckung (inkl. Porto)" price="1,90 €" />
            <PriceRow label="Ermittlung Sachverhalt (Nicht-Verbraucher)" price="25,00 €" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* B-V  KARTENZAHLUNGEN                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="karten"
            label="Karten"
            title="Kartenzahlungen"
            description="Debit- und Kreditkarten – Jahresentgelte und Einsatzkonditionen."
          />

          <SubSection title="Debitkarten – Kartenentgelte">
            <PriceRow label="senacor.bank Girocard" price="10,00 € / Jahr" note="Soweit nicht in Kontopauschale enthalten" />
            <PriceRow label="Mastercard Debit" price="3,50 € / Monat" />
            <PriceRow label="Virtual Debit Card" price="0,00 € / Monat" />
            <PriceRow label="Ersatz-PIN Girocard" price="5,00 €" />
            <PriceRow label="Ersatzkarte Girocard" price="15,00 €" />
          </SubSection>

          <SubSection title="Debitkarten – Einsatzentgelte beim Bezahlen">
            <PriceRow label="Girocard Inland" price="entgeltfrei" />
            <PriceRow label="Girocard Ausland (EU, Euro)" price="entgeltfrei" />
            <PriceRow label="Girocard Ausland (EU, andere Währung)" price="1 % (min. 1,50 €)" />
            <PriceRow label="Girocard Ausland (Nicht-EU)" price="1 % (min. 2,50 €)" />
            <PriceRow label="Mastercard Debit / Virtual Debit – Inland" price="entgeltfrei" />
            <PriceRow label="Mastercard Debit / Virtual Debit – Ausland" price="1,5 % Auslandseinsatzentgelt" note="Zzgl. 0,59 % Währungsumrechnung im EWR" />
          </SubSection>

          <SubSection title="Kreditkarten – Jahresentgelte">
            <PriceRow label="ClassicKreditkarte (Mastercard / Visa)" price="39,90 € / Jahr" />
            <PriceRow label="Zusatzkarte Classic (Bestandsgeschäft)" price="29,90 € / Jahr" indent />
            <PriceRow label="GoldKreditkarte (Mastercard / Visa)" price="99,90 € / Jahr" />
            <PriceRow label="Zusatzkarte Gold (Bestandsgeschäft)" price="79,90 € / Jahr" indent />
            <PriceRow label="PremiumKreditkarte – jede weitere Karte" price="59,90 € / Jahr" note="Max. 2 MC + 2 Visa im PremiumKonto inklusive" />
            <PriceRow label="Prepaid Karte Junior (bis 18 Jahre)" price="0,00 €" />
            <PriceRow label="Prepaid Karte (ab 18 Jahre)" price="39,90 € / Jahr" />
          </SubSection>

          <SubSection title="Kreditkarten – Einsatzentgelte beim Bezahlen">
            <PriceRow label="Inland" price="entgeltfrei" />
            <PriceRow label="Ausland" price="1,75 % Auslandseinsatzentgelt" note="Zzgl. 0,59 % Währungsumrechnung im EWR" />
          </SubSection>

          <SubSection title="3-Raten-Service">
            <PriceRow label="Registrierung" price="0,00 €" />
            <PriceRow label="200 – 999,99 € (Classic / Young Visa)" price="4,90 €" />
            <PriceRow label="200 – 999,99 € (Gold / Premium)" price="3,90 €" />
            <PriceRow label="1.000 – 1.999,99 € (Classic / Young Visa)" price="9,90 €" />
            <PriceRow label="1.000 – 1.999,99 € (Gold / Premium)" price="8,90 €" />
            <PriceRow label="2.000 – 2.999,99 € (Classic / Young Visa)" price="14,90 €" />
            <PriceRow label="2.000 – 2.999,99 € (Gold / Premium)" price="13,90 €" />
            <PriceRow label="3.000 – 4.999,99 € (Classic / Young Visa)" price="19,90 €" />
            <PriceRow label="3.000 – 4.999,99 € (Gold / Premium)" price="18,90 €" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* C  WERTPAPIERDIENSTLEISTUNGEN                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="wertpapiere"
            label="Wertpapiere"
            title="Wertpapierdienstleistungen"
            description="Depotmodelle, Provisionen und Vermögensverwaltung im Überblick."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            <ProductCard
              title="PremiumDepot"
              price="1,45 %"
              period="p.a. inkl. USt."
              highlight
              features={[
                'Pauschalentgelt auf Depotvolumen',
                'Mindestentgelt 145 € / Quartal',
                'Beratung & Research inklusive',
                'Keine gesonderten Provisionen',
                'Investmentfonds ohne Ausgabeaufschlag',
                'Vorabbefreiung Quellensteuer',
              ]}
            />
            <ProductCard
              title="PremiumFondsDepot"
              price="0,90 %"
              period="p.a. inkl. USt."
              features={[
                'Pauschalentgelt auf Depotvolumen',
                'Mindestentgelt 90 € / Quartal',
                'Ausgewählte Investmentfonds',
                'Beratung & Information inklusive',
                'Keine gesonderten Provisionen',
                'Vorabbefreiung Quellensteuer',
              ]}
            />
            <ProductCard
              title="KlassikDepot"
              price="0,25 %"
              period="p.a. inkl. USt."
              features={[
                'Depotentgelt auf Depotvolumen',
                'Mindestentgelt 19,90 € / Quartal',
                'Aktien-Provision: 1,0 % + 4,90 €',
                'Renten-Provision: 0,5 % + 4,90 €',
                'Online-Rabatt: 20 % auf Provision',
                'Limitentgelt: 5 € / Monat',
              ]}
            />
            <ProductCard
              title="StartDepot"
              price="0,00 €"
              period="bis 20.000 €"
              features={[
                'Für Schüler, Studenten, Azubis (bis 30 J.)',
                'Bis 20.000 € Depotvolumen entgeltfrei',
                'Aktien-Provision: 1,0 % + 4,90 €',
                'Kein Mindestentgelt',
                'Keine Limitentgelte',
                'Danach auto. Umstellung auf KlassikDepot',
              ]}
            />
            <ProductCard
              title="DirektDepot"
              price="0,25 %"
              period="p.a. (nur ohne Trade)"
              features={[
                'Nur Online-Auftragserteilung',
                'Provision: 0,25 % + 4,90 € (min. 9,90 €)',
                'Quartale mit Trade: entgeltfrei',
                'Mindestentgelt 4,95 € / Quartal',
                'Keine Limitentgelte',
                'Tel. Order: zzgl. 9,50 €',
              ]}
            />
            <ProductCard
              title="money mate"
              price="0,00 €"
              period="Monat"
              features={[
                'Konto + Depot als Kombiprodukt',
                'Kauf & Verkauf der Fonds entgeltfrei',
                'Kein Depotentgelt',
                'Automatische Anlage ab 50 € Schwellwert',
                'Fortlaufende Geeignetheitsprüfung',
                'Nur mit elektronischem Postfach',
              ]}
            />
          </div>

          <SubSection title="Vermögensverwaltung – ACTIVE Selection (Pauschales Entgelt)">
            <PriceRow label="Fixed Income" price="1,79 % p.a. inkl. USt." />
            <PriceRow label="ACTIVE Selection 25" price="1,90 % p.a. inkl. USt." />
            <PriceRow label="ACTIVE Selection 50" price="2,02 % p.a. inkl. USt." />
            <PriceRow label="ACTIVE Selection 75" price="2,14 % p.a. inkl. USt." />
            <PriceRow label="ACTIVE Selection 95" price="2,14 % p.a. inkl. USt." />
          </SubSection>

          <SubSection title="Vermögensverwaltung – INDEX Selection (Pauschales Entgelt)">
            <PriceRow label="Fixed Income" price="1,79 % p.a. inkl. USt." />
            <PriceRow label="INDEX Selection 25" price="1,90 % p.a. inkl. USt." />
            <PriceRow label="INDEX Selection 50" price="2,02 % p.a. inkl. USt." />
            <PriceRow label="INDEX Selection 75" price="2,14 % p.a. inkl. USt." />
            <PriceRow label="INDEX Selection 95" price="2,14 % p.a. inkl. USt." />
          </SubSection>

          <SubSection title="Vermögensverwaltung – Nachhaltigkeit (Pauschales Entgelt)">
            <PriceRow label="Vermögenserhalt" price="1,79 % p.a. inkl. USt." />
            <PriceRow label="Vermögensausbau Konservativ" price="1,90 % p.a. inkl. USt." />
            <PriceRow label="Vermögensausbau Dynamisch" price="2,02 % p.a. inkl. USt." />
            <PriceRow label="Vermögenswachstum" price="2,14 % p.a. inkl. USt." />
          </SubSection>

          <SubSection title="Quellensteuer-Dienstleistungen">
            <PriceRow label="Vorabbefreiung / -reduzierung" price="5,00 € je Zahlungsvorgang zzgl. USt." note="Zzgl. fremde Spesen" />
            <PriceRow label="Quellensteuererstattung" price="20,00 € je Zahlungsvorgang zzgl. USt." note="Zzgl. fremde Spesen" />
            <PriceRow label="Ausstellung Tax-Voucher" price="10,00 € / Stück zzgl. USt." />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* D  KREDITGESCHÄFT                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="kredit"
            label="Kreditgeschäft"
            title="Kredite, Auskünfte & Avale"
            description="Konditionen für Ratenkredite, Kreditbearbeitung und Sicherheiten."
          />

          <SubSection title="Kreditbearbeitung – Allgemein">
            <PriceRow label="Unterjährige Zinsbescheinigung" price="29,90 € / Jahr & Unterkonto" />
            <PriceRow label="Unterjährige Kreditlinien- / Saldenbestätigung" price="29,90 € / Jahr & Unterkonto" />
            <PriceRow label="Einsichtnahme Register / Registerauszug" price="30,00 € zzgl. fremde Kosten" />
            <PriceRow label="Zweitschriften / Nachdrucke" price="11,00 € / Dokument" />
            <PriceRow label="Nachträgliche Kreditvertragsänderung" price="450,00 € / Kredit" />
          </SubSection>

          <SubSection title="Schuldnermodifikation">
            <PriceRow label="Schuldnerwechsel / Schuldübernahme" price="1.020,00 €" />
            <PriceRow label="Schuldhaftentlassung" price="650,00 €" />
          </SubSection>

          <SubSection title="Ratenkredite – Sonderleistungen">
            <PriceRow label="Kopien (mind. 1,00 €)" price="0,25 € / Blatt" />
            <PriceRow label="Kontoauszug" price="5,00 €" />
            <PriceRow label="Außerplanmäßige Saldenbestätigung" price="14,90 €" />
            <PriceRow label="Aufstellung Zins- und Tilgungsleistungen" price="15,00 €" />
          </SubSection>

          <SubSection title="Sicherheiten">
            <PriceRow label="Freigabe von Sicherheiten (ohne Grundpfandrechte)" price="300,00 € / Sicherheit" />
            <PriceRow label="Austausch / Änderung Sicherheitenvertrag" price="475,00 € / Sicherheit" />
            <PriceRow label="Grundpfandrecht – Austausch / Änderung" price="1.200,00 €" />
            <PriceRow label="Grundpfandrecht – Pfandfreigabe (ohne Deckungsänderung)" price="375,00 €" />
            <PriceRow label="Grundpfandrecht – Pfandfreigabe (mit Deckungsänderung)" price="425,00 €" />
            <PriceRow label="Grundpfandrecht – Rangänderung" price="500,00 €" />
          </SubSection>

          <SubSection title="Auskünfte & Avale">
            <PriceRow label="Schriftliche Bankauskunft an Dritte" price="20,00 €" />
            <PriceRow label="Einholung allg. Bankauskunft (In- und Ausland)" price="25,00 €" />
            <PriceRow label="Avalprovision" price="3,5 % p.a. (min. 50 € p.a.)" />
            <PriceRow label="Urkundenerstellung – maschinell" price="50,00 €" />
            <PriceRow label="Urkundenerstellung – manuell" price="100,00 €" />
            <PriceRow label="Direktversand Urkunde an Dritte" price="10,00 €" />
            <PriceRow label="Urkundenversand per Kurier" price="35,00 €" />
          </SubSection>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SONSTIGES                                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section>
          <SectionHeading
            id="sonstiges"
            label="Sonstiges"
            title="Weitere Entgelte"
            description="Ergänzende Dienstleistungen und allgemeine Informationen."
          />

          <SubSection title="Sonstige Leistungen">
            <PriceRow label="Erträgnisaufstellung" price="25,00 €" />
            <PriceRow label="Entgeltaufstellung gem. Zahlungskontengesetz" price="0,00 €" />
            <PriceRow label="Bestätigung Zinsgutschriften/-belastungen" price="11,00 €" />
            <PriceRow label="Ersatzsteuerbescheinigung" price="10,00 € / Ausfertigung" />
            <PriceRow label="FAX auf Verlangen" price="4,00 €" />
            <PriceRow label="mobileTAN per SMS" price="0,12 € / SMS inkl. MwSt." />
          </SubSection>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/">
                <span className="text-xl font-black text-white">senacor<span style={{ color: '#7da0d7' }}>.bank</span></span>
              </Link>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Wir gestalten die Bank der Zukunft – digital, fair und immer nah am Menschen.
              </p>
            </div>
            {[
              { heading: 'Produkte', links: [{ label: 'Girokonto', href: '/produkte#konten' }, { label: 'Karten', href: '/produkte#karten' }, { label: 'Wertpapiere', href: '/produkte#wertpapiere' }, { label: 'Kredite', href: '/produkte#kredit' }] },
              { heading: 'Unternehmen', links: [{ label: 'Über uns', href: '#' }, { label: 'Nachhaltigkeit', href: '#' }, { label: 'Presse', href: '#' }, { label: 'Karriere', href: '#' }] },
              { heading: 'Service', links: [{ label: 'Kontakt', href: '#' }, { label: 'FAQ', href: '#' }, { label: 'Sicherheit', href: '#' }, { label: 'Datenschutz', href: '#' }] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h5 className="text-white font-bold text-sm mb-4">{heading}</h5>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{l.label}</Link>
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
    </div>
  )
}
