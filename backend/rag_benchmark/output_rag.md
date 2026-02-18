# RAG Benchmark Report

**Datum:** 17.02.2026 13:48:09

**Anzahl Fragen:** 5

**Generatoren:** Azure OpenAI vs. OpenRouter

---

## Frage 1: Welche Arten von Kreditkarten gibt es?

### Timing-Vergleich

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Embedding Generation | 0.380s | 0.087s |
| Vector Search | 0.318s | 0.077s |
| Chunks gefunden | 5 | 5 |
| LLM First Token | 3.293s | 0.715s |
| LLM Generation (Total) | 3.780s | 3.300s |
| Tokens generiert | 48 | 51 |
| **Gesamt** | **4.479s** | **3.464s** |

### 🔵 Azure OpenAI Ergebnis

#### Antwort

Laut dem Verzeichnis gibt es folgende Kreditkartenarten:
- Classic‑Kreditkarte
- Gold‑Kreditkarte
- Premium‑Kreditkarte
- Prepaid‑Karte
- Young Visa‑Kreditkarte

### 🟠 OpenRouter Ergebnis

#### Antwort

Im Dokument werden folgende Kreditkartenarten genannt:

- Mastercard / Visa (Marken)  
- Classic-Kreditkarte  
- Gold-Kreditkarte  
- Premium-Kreditkarte  
- Prepaid-Karte  
- Young Visa Kreditkarte

---

## Frage 2: Welche Arten von Bankkonten gibt es?

### Timing-Vergleich

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Embedding Generation | 0.896s | 0.208s |
| Vector Search | 0.083s | 0.096s |
| Chunks gefunden | 5 | 5 |
| LLM First Token | 3.229s | 0.600s |
| LLM Generation (Total) | 5.038s | 5.637s |
| Tokens generiert | 162 | 215 |
| **Gesamt** | **6.017s** | **5.941s** |

### 🔵 Azure OpenAI Ergebnis

#### Antwort

Im vorliegenden Preis- und Leistungsverzeichnis sind folgende Kontotypen für Privatkunden aufgeführt:

- PremiumKonto (Monatspauschale 12,90 EUR)  
- KlassikKonto (Monatspauschale 9,90 EUR; Neuverträge ab 01.02.2025)  
- GiroKonto (Monatspreis 4,90 EUR; bei Vermögenswerten ≥ 50.000 EUR im Kalendermonat kostenfrei)  
- StartKonto (für Schüler/Auszubildende/Studierende etc. 7–27 Jahre: 0,00 EUR; bei Fortbestehen ab 28. Geburtstag 9,90 EUR)

Diese Konten sind als persönliche/Privatkonten ausgewiesen.

### 🟠 OpenRouter Ergebnis

#### Antwort

Laut dem vorgelegten Preis‑ und Leistungsverzeichnis gibt es folgende Kontenmodelle für Privatkunden:

- PremiumKonto  
- KlassikKonto (für Neuverträge ab 01.02.2025)  
- GiroKonto (für Neuverträge ab 17.02.2025)  
- StartKonto (für Neuverträge ab 15.04.2021; vorrangig für Schüler, Auszubildende, Studierende etc.)

Diese Aufstellung bezieht sich auf die persönlichen/privaten Konten im Dokument.

---

## Frage 3: Was ist ein Dauerauftrag?

### Timing-Vergleich

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Embedding Generation | 0.270s | 0.117s |
| Vector Search | 0.096s | 0.091s |
| Chunks gefunden | 5 | 5 |
| LLM First Token | 3.923s | 0.676s |
| LLM Generation (Total) | 4.672s | 6.506s |
| Tokens generiert | 91 | 205 |
| **Gesamt** | **5.037s** | **6.714s** |

### 🔵 Azure OpenAI Ergebnis

#### Antwort

Der vorliegende Auszug nennt „Einrichtung / Änderung / Ausführung von SEPA‑Daueraufträgen“ als Leistung, enthält aber keine Definition. 

Kurz erklärt (allgemein): Ein Dauerauftrag ist eine vom Kontoinhaber erteilte Anweisung an die Bank, regelmäßig wiederkehrende Zahlungen in gleicher Höhe automatisch an denselben Empfänger auszuführen (z. B. monatliche Miete oder Abonnements).

### 🟠 OpenRouter Ergebnis

#### Antwort

Im vorliegenden Auszug wird der Begriff „Dauerauftrag“ nicht erklärt.  

Allgemein (nicht im Kontext definiert): Ein Dauerauftrag ist ein vom Kontoinhaber an die Bank erteilter, wiederkehrender Zahlungsauftrag, mit dem ein fester Betrag in festgelegten Intervallen automatisch an denselben Empfänger überwiesen wird (z. B. für Miete oder Abos). Der Auszug nennt die Bankleistungen „Einrichtung / Änderung / Ausführung von SEPA‑Daueraufträgen“, gibt aber keine weitergehende Definition.

---

## Frage 4: Welche Sorten von Edelmetalle gibt es?

### Timing-Vergleich

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Embedding Generation | 0.220s | 0.263s |
| Vector Search | 0.079s | 0.099s |
| Chunks gefunden | 5 | 5 |
| LLM First Token | 5.543s | 0.619s |
| LLM Generation (Total) | 6.161s | 7.255s |
| Tokens generiert | 81 | 192 |
| **Gesamt** | **6.460s** | **7.616s** |

### 🔵 Azure OpenAI Ergebnis

#### Antwort

Die vorliegenden Auszüge nennen keine einzelnen Edelmetallarten. Es steht nur, dass aktuelle Sortenkurse / Preise für Edelmetalle auf www.commerzbank.de und bei den Beratern in der Filiale erhältlich sind. (Hinweis aus dem Dokument: Abwicklungskosten Edelmetalle pro Transaktion 12,60 EUR; Versandkosten innerhalb Festland DE 7,90 EUR.)

### 🟠 OpenRouter Ergebnis

#### Antwort

Im vorliegenden Auszug werden keine konkreten Sorten (z. B. Gold, Silber, Münzen) aufgelistet. Es werden nur die Kategorien „Sorten“ und „Edelmetalle“ sowie Gebühren genannt (Abwicklungskosten Sorten 0,00 EUR; Edelmetalle 12,60 EUR; Versand z. D. 7,90 EUR).

Für die konkrete Aufstellung der verfügbaren Sorten/Edelmetalle verweist das Dokument auf www.commerzbank.de oder die Beratung in der Filiale.

---

## Frage 5: Was ist ein klassik depot?

### Timing-Vergleich

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Embedding Generation | 0.376s | 0.263s |
| Vector Search | 0.097s | 0.103s |
| Chunks gefunden | 5 | 5 |
| LLM First Token | 4.753s | 0.610s |
| LLM Generation (Total) | 5.908s | 5.526s |
| Tokens generiert | 122 | 167 |
| **Gesamt** | **6.380s** | **5.893s** |

### 🔵 Azure OpenAI Ergebnis

#### Antwort

Aus dem vorliegenden Text geht hervor, dass das KlassikDepot ein Depotmodell der Bank (ein Wertpapierdepot) ist, bei dem
- die für das Depot erbrachten Leistungen nach dem im Preis‑ und Leistungsverzeichnis aufgeführten Entgeltschema berechnet werden, und
- Beratungsleistungen nicht gesondert bepreist, sondern durch die vereinbarten Festpreise bzw. Entgelte mitabgedeckt sind.

Weitere konkrete Leistungs‑ oder Gebührenangaben zum KlassikDepot (z. B. genaue Festpreise) sind im vorliegenden Auszug nicht enthalten.

### 🟠 OpenRouter Ergebnis

#### Antwort

Die bereitgestellte Kontextauszug enthält keine vollständige Definition. Aus dem Text geht nur Folgendes hervor:

- Das KlassikDepot ist ein Depotmodell (bei der Commerzbank).  
- Für dieses Modell fallen bestimmte Entgelte für die Leistungen der Bank an (diese werden im Dokument aufgeführt).  
- Beratungsleistungen werden nicht gesondert berechnet, sondern sind durch die vereinbarten Festpreise bzw. Entgelte abgedeckt.  
- Es folgt im Dokument ein Abschnitt „Festpreisgeschäft und Investmentfonds“, der jedoch im Auszug abgeschnitten ist.

Wenn Sie möchten, kann ich mehr Details nennen (z. B. konkrete Gebühren oder Leistungsumfang) — dafür bräuchte ich den vollständigen Abschnitt zum KlassikDepot aus dem Preis‑ und Leistungsverzeichnis.

---

## Zusammenfassung

### Durchschnittliche Zeiten

| Metrik | Azure OpenAI | OpenRouter |
|--------|--------------|------------|
| Durchschn. First Token | 4.148s | 0.644s |
| Durchschn. LLM Generation | 5.112s | 5.645s |
| Durchschn. Gesamtzeit | 5.675s | 5.925s |

**Schneller:** 🔵 Azure OpenAI (um 0.251s schneller)
