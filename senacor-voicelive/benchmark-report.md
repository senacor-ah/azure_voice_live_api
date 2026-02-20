# RAG Benchmark Report — Dual Prompt Comparison

**Date:** 2026-02-20T13:35:33.616Z
**Questions:** 10
**Configs:** 14
**Prompt Variants:** current (production prompt) vs optimized (model-specific)

## Summary

| Config | Prompt | Embed (ms) | Search (ms) | TTFT (ms) | LLM (ms) | Total (ms) | Tokens | Chars |
|--------|--------|-----------|------------|----------|---------|-----------|--------|-------|
| openai/gpt-5-mini [current] | 📋 current | 237 | 86 | 5413 | 5449 | 5772 | 5 | 23 |
| openai/gpt-5-mini [optimized] | ✨ optimized | 244 | 87 | 7267 | 7267 | 7598 | 0 | 0 |
| openai/gpt-5.1 [current] | 📋 current | 175 | 76 | 3595 | 3771 | 4023 | 26 | 110 |
| openai/gpt-5.1 [optimized] | ✨ optimized | 175 | 75 | 3928 | 4291 | 4542 | 54 | 237 |
| openai/gpt-5.2-chat [current] | 📋 current | 620 | 71 | 2359 | 2834 | 3525 | 39 | 144 |
| openai/gpt-5.2-chat [optimized] | ✨ optimized | 241 | 68 | 2084 | 3017 | 3326 | 64 | 268 |
| openai/gpt-4o-mini [current] | 📋 current | 114 | 63 | 512 | 871 | 1048 | 20 | 88 |
| openai/gpt-4o-mini [optimized] | ✨ optimized | 94 | 62 | 697 | 1447 | 1602 | 30 | 125 |
| openai/gpt-4o [current] | 📋 current | 96 | 62 | 432 | 551 | 709 | 14 | 66 |
| openai/gpt-4o [optimized] | ✨ optimized | 134 | 60 | 505 | 841 | 1034 | 32 | 134 |
| openai/gpt-4.1-mini [current] | 📋 current | 258 | 64 | 721 | 1260 | 1583 | 39 | 175 |
| openai/gpt-4.1-mini [optimized] | ✨ optimized | 209 | 68 | 844 | 1304 | 1581 | 32 | 124 |
| openai/gpt-4.1-nano [current] | 📋 current | 101 | 62 | 589 | 941 | 1104 | 30 | 118 |
| openai/gpt-4.1-nano [optimized] | ✨ optimized | 86 | 59 | 575 | 816 | 961 | 24 | 101 |

## Prompt Comparison by Model

### openai/gpt-5-mini

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 5449 | 7267 | +1818 |
| Avg TTFT (ms) | 5413 | 7267 | +1854 |
| Avg Chars | 23 | 0 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet 12,90 EUR pro Monat. |  |
| Welche Kontomodelle bietet die Senacor Bank an? |  |  |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |  |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |  |
| Was kostet eine SEPA-Überweisung? |  |  |
| Welche Kreditkartenmodelle gibt es und was kosten  |  |  |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau |  |  |
| Welche Gebühren fallen bei Auslandsüberweisungen a |  |  |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |  |
| Gibt es ein kostenloses Girokonto bei der Senacor  |  |  |

### openai/gpt-5.1

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 3771 | 4291 | +520 |
| Avg TTFT (ms) | 3595 | 3928 | +333 |
| Avg Chars | 110 | 237 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet 12,90 EUR pro Monat. | Das PremiumKonto kostet pro Monat eine Monatspauschale von 12,90 EUR. In dieser Pauschale sind sämtliche Buchungsposten enthalten. Außerdem ist die Co |
| Welche Kontomodelle bietet die Senacor Bank an? | Im Kontext wird als Kontomodell für Privatkonten das „PremiumKonto“ mit einer Monatspauschale von 12,90 EUR genannt. Weitere Kontomodelle sind im vorl |  |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im bereitgestellten Kontext finden sich nur Angaben zu Mietkautionskonten sowie Kontofü |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den vorliegenden Unterlagen finde ich nur Angaben zum PremiumKonto mit einer Monatsp |
| Was kostet eine SEPA-Überweisung? | Eine beleghaft beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Zu den Kosten für online erteilte SEPA-Überweisungen liegen mir aktuell k | Für eine beleghaft beauftragte SEPA-Überweisung berechnet die Bank 2,50 EUR pro Überweisung. Der gleiche Preis von 2,50 EUR gilt laut Preisverzeichnis |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |  |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag. Das Wochenlimit liegt ebenfalls bei 2.000,00 E | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard liegt bei 2.000,00 EUR pro Tag. Das Wochenlimit beträgt ebenfalls 2.000,00 E |
| Welche Gebühren fallen bei Auslandsüberweisungen a |  | Bei Auslandsüberweisungen fällt für die Währungsumrechnung bei Überweisungen in einer anderen Währung als der Kontowährung ein |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im vorliegenden Preisaushang werden unter anderem das PremiumKonto und verschiedene Spe |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Im vorliegenden Auszug des Preis- und Leistungsverzeichnisses werden nur kostenpflichtige Kontomodelle (z. B. PremiumKonto, BasisKonto) mit monatliche | Im vorliegenden Preis- und Leistungsverzeichnis werden nur kostenpflichtige Kontomodelle genannt. Das PremiumKonto kostet 12,90 EUR pro Monat, das Bas |

### openai/gpt-5.2-chat

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 2834 | 3017 | +184 |
| Avg TTFT (ms) | 2359 | 2084 | -275 |
| Avg Chars | 144 | 268 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet 12,90 EUR pro Monat.   Es handelt sich um eine monatliche Pauschale. | Die Monatspauschale für das PremiumKonto beträgt 12,90 EUR. Dieser Preis gilt pro Monat laut Preis- und Leistungsverzeichnis. |
| Welche Kontomodelle bietet die Senacor Bank an? | Die Senacor Bank bietet für Privatkunden das Kontomodell PremiumKonto an.   Weitere Kontomodelle sind im vorliegenden Kontext nicht aufgeführt. | Die Senacor Bank bietet im Privatkundenbereich unter anderem das PremiumKonto mit einer Monatspauschale von 12,90 EUR an, inklusive sämtlicher Buchung |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Auszügen sind keine Preise für ein Bankschließfach der Größe M  |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet eine SEPA-Überweisung? | Die Ausführung einer beleghaft beauftragten SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Dies gilt auch für SEPA-Echtzeitüberweisungen. | Die Ausführung einer beleghaft beauftragten SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Dieser Preis gilt auch für SEPA-Echtzeitüberweisungen. |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. In dem bereitgestellten Auszug sind keine konkreten Kreditkartenmodelle oder deren Jahr |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Mit der Commerzbank Girocard beträgt das Tageslimit am Geldautomaten 2.000,00 EUR.   Das Wochenlimit liegt ebenfalls bei 2.000,00 EUR.   Im Ausland gi | Mit der Commerzbank Girocard beträgt das Bargeldauszahlungslimit am Geldautomaten 2.000,00 EUR pro Tag. Das Wochenlimit liegt ebenfalls bei 2.000,00 E |
| Welche Gebühren fallen bei Auslandsüberweisungen a | Bei Überweisungseingängen fällt ein Standardabwicklungsentgelt von 2,50 EUR pro Überweisung an. Zusätzlich werden bei SHARE- oder BEN-Überweisungen tr | Bei Auslandsüberweisungen fällt bei einer Währungsumrechnung ein Entgelt von 7,50 EUR für Beträge unter 12.500,00 EUR an, ab 12.500,00 EUR werden 1,0  |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Unterlagen sind keine Angaben zu den Konditionen oder Unterschi |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Nein, ein kostenloses Girokonto wird nicht angeboten.   Das PremiumKonto kostet 12,90 EUR pro Monat, das BasisKonto 6,90 EUR pro Monat. | Ein kostenloses Girokonto wird nicht angeboten. Das PremiumKonto kostet 12,90 EUR pro Monat. Das BasisKonto ist für 6,90 EUR pro Monat erhältlich. Bei |

### openai/gpt-4o-mini

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 871 | 1447 | +576 |
| Avg TTFT (ms) | 512 | 697 | +185 |
| Avg Chars | 88 | 125 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet pro Monat 12,90 EUR. | Das PremiumKonto kostet pro Monat 12,90 EUR. |
| Welche Kontomodelle bietet die Senacor Bank an? | Die Senacor Bank bietet unter anderem das Preismodell PremiumKonto für Privatkonten an, welches eine monatliche Pauschale von 12,90 EUR umfasst. Weite | Die Senacor Bank bietet unter anderem das PremiumKonto an, das eine Monatspauschale von 12,90 EUR hat. Weitere Kontomodelle und Details sind in unsere |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet eine SEPA-Überweisung? | Eine SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Bei Eilüberweisungen fällt ein Betrag von 15,00 EUR zzgl. fremder Kosten an. | Eine SEPA-Überweisung kostet pro Überweisung 2,50 EUR. Bei einer SHARE- oder BEN-Überweisung fallen zusätzliche Gebühren an, wobei Beträge unter 13,00 |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag. | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt täglich 2.000,00 EUR und wöchentlich 2.000,00 EUR. Das Auslandslimit |
| Welche Gebühren fallen bei Auslandsüberweisungen a | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |

### openai/gpt-4o

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 551 | 841 | +289 |
| Avg TTFT (ms) | 432 | 505 | +73 |
| Avg Chars | 66 | 134 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet pro Monat 12,90 EUR. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Welche Kontomodelle bietet die Senacor Bank an? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Die Senacor Bank bietet unter anderem das PremiumKonto an, das monatlich 12,90 EUR kostet. Dieses Konto beinhaltet sämtliche Buchungsposten und die Nu |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet eine SEPA-Überweisung? | Eine SEPA-Überweisung kostet bei beleghafter Ausführung 2,50 EUR pro Überweisung. | Eine beleghaft beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag. | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag. |
| Welche Gebühren fallen bei Auslandsüberweisungen a | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Bei Auslandsüberweisungen können je nach Betrag und Art der Überweisung unterschiedliche Gebühren anfallen. Für eine SHARE- oder BEN-Überweisung falle |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |

### openai/gpt-4.1-mini

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 1260 | 1304 | +44 |
| Avg TTFT (ms) | 721 | 844 | +123 |
| Avg Chars | 175 | 124 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet 12,90 EUR pro Monat. | Das PremiumKonto kostet 12,90 Euro pro Monat. |
| Welche Kontomodelle bietet die Senacor Bank an? | Die Senacor Bank bietet unter anderem das PremiumKonto als Kontomodell für Privatkunden an. Weitere Kontomodelle sind aus dem bereitgestellten Kontext | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im Kontext werden keine Angaben zur Monatspauschale des StartKontos für Studenten genan | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet eine SEPA-Überweisung? | Eine beleghafte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Für beleglose SEPA-Überweisungen mit photoTAN fallen ebenfalls 2,50 EUR an. Weitere  | Eine beleghafte oder per Online Banking mit photoTAN beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Beträge unter 13,00 EUR bei SHARE-  |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im vorliegenden Kontext sind keine vollständigen Angaben zu den Kreditkartenmodellen un | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt pro Tag 2.000 Euro und pro Woche 2.000 Euro. Im Ausland liegt das Ta | Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000 Euro pro Tag und 2.000 Euro pro Woche, im Ausland sind maximal |
| Welche Gebühren fallen bei Auslandsüberweisungen a | Bei Auslandsüberweisungen fallen folgende Gebühren an: Für Beträge unter 12.500 EUR beträgt die Gebühr 7,50 EUR, ab 12.500 EUR 1,0 ‰ des Betrags. Zusä | Bei Auslandsüberweisungen fallen für Beträge unter 12.500 EUR 7,50 EUR an Gebühren an. Ab 12.500 EUR wird ein Entgelt von 1,0 ‰ des Betrags berechnet. |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im bereitgestellten Kontext werden KlassikKonto und GiroKonto nicht beschrieben oder ge | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Dokumenten werden Kontomodelle mit monatlichen Pauschalen genan | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |

### openai/gpt-4.1-nano

| Metric | Current | Optimized | Δ |
|--------|---------|-----------|---|
| Avg LLM (ms) | 941 | 816 | -126 |
| Avg TTFT (ms) | 589 | 575 | -14 |
| Avg Chars | 118 | 101 | — |

| Question | Current Answer | Optimized Answer |
|----------|---------------|-----------------|
| Was kostet das PremiumKonto pro Monat? | Das PremiumKonto kostet 12,90 EUR pro Monat. | Das PremiumKonto kostet 12,90 EUR monatlich. |
| Welche Kontomodelle bietet die Senacor Bank an? | Die Senacor Bank bietet das PremiumKonto mit einer monatlichen Pauschale von 12,90 EUR an. Es sind keine weiteren Kontomodelle in den verfügbaren Doku | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet ein Bankschließfach in der Größe M? | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist die Monatspauschale beim StartKonto f | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Was kostet eine SEPA-Überweisung? | Eine SEPA-Überweisung kostet 2,50 EUR bei Online-Banking mit photoTAN. Für beleghafte Beauftragungen oder Echtzeitüberweisungen gilt ebenfalls ein Pre | Eine SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Bei photoTAN-Ausführung, beleghaft beauftragter SEPA-Überweisung oder SEPA-Echtzeitüberweisung  |
| Welche Kreditkartenmodelle gibt es und was kosten  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Wie hoch ist das Bargeldauszahlungslimit am Geldau | Das Bargeldauszahlungslimit am Geldautomaten mit Girocard beträgt 122.000 EUR pro Tag. | Das Bargeldauszahlungslimit am Geldautomaten mit Girocard beträgt 122.000 EUR pro Tag. |
| Welche Gebühren fallen bei Auslandsüberweisungen a | Bei Auslandsüberweisungen fallen Gebühren von 7,50 EUR für Beträge unter 12.500 EUR an, sowie 1,0 ‰ bei Beträgen ab 12.500 EUR. Es fallen außerdem fre | Bei Währungsumrechnungen bei Überweisungen in einer anderen Währung als der Kontowährung fallen 7,50 EUR bei Beträgen unter 12.500 EUR und 1,0 ‰ bei B |
| Was ist der Unterschied zwischen KlassikKonto und  | Dazu liegen mir aktuell keine ausreichenden Informationen vor. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |
| Gibt es ein kostenloses Girokonto bei der Senacor  | Ja, es gibt ein BasisKonto, das monatlich 6,90 EUR kostet. Ein kostenloses Girokonto war im bereitgestellten Kontekt nicht erwähnt. | Dazu liegen mir aktuell keine ausreichenden Informationen vor. |


## Detailed Answers

### openai/gpt-5-mini [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR pro Monat.

*Embed: 241ms | Search: 124ms | TTFT: 3336ms | LLM: 3461ms | Total: 3826ms | 13 tokens*

### openai/gpt-5-mini [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** 

*Embed: 77ms | Search: 94ms | TTFT: 7978ms | LLM: 7978ms | Total: 8149ms | 0 tokens*

### openai/gpt-5-mini [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 200ms | Search: 69ms | TTFT: 4698ms | LLM: 4749ms | Total: 5018ms | 11 tokens*

### openai/gpt-5-mini [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 286ms | Search: 90ms | TTFT: 3931ms | LLM: 3991ms | Total: 4367ms | 11 tokens*

### openai/gpt-5-mini [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** 

*Embed: 203ms | Search: 86ms | TTFT: 5959ms | LLM: 5959ms | Total: 6248ms | 0 tokens*

### openai/gpt-5-mini [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** 

*Embed: 231ms | Search: 55ms | TTFT: 5346ms | LLM: 5346ms | Total: 5632ms | 0 tokens*

### openai/gpt-5-mini [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** 

*Embed: 234ms | Search: 85ms | TTFT: 5684ms | LLM: 5684ms | Total: 6002ms | 0 tokens*

### openai/gpt-5-mini [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** 

*Embed: 240ms | Search: 87ms | TTFT: 5693ms | LLM: 5693ms | Total: 6020ms | 0 tokens*

### openai/gpt-5-mini [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 424ms | Search: 91ms | TTFT: 5334ms | LLM: 5454ms | Total: 5969ms | 11 tokens*

### openai/gpt-5-mini [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** 

*Embed: 234ms | Search: 84ms | TTFT: 6170ms | LLM: 6170ms | Total: 6488ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** 

*Embed: 417ms | Search: 86ms | TTFT: 6963ms | LLM: 6963ms | Total: 7467ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** 

*Embed: 215ms | Search: 93ms | TTFT: 8707ms | LLM: 8707ms | Total: 9015ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** 

*Embed: 228ms | Search: 85ms | TTFT: 5646ms | LLM: 5646ms | Total: 5959ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** 

*Embed: 213ms | Search: 84ms | TTFT: 6667ms | LLM: 6667ms | Total: 6964ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** 

*Embed: 205ms | Search: 93ms | TTFT: 11082ms | LLM: 11082ms | Total: 11379ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** 

*Embed: 241ms | Search: 91ms | TTFT: 7740ms | LLM: 7740ms | Total: 8071ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** 

*Embed: 228ms | Search: 87ms | TTFT: 4827ms | LLM: 4827ms | Total: 5143ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** 

*Embed: 240ms | Search: 82ms | TTFT: 5428ms | LLM: 5428ms | Total: 5750ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** 

*Embed: 251ms | Search: 83ms | TTFT: 6197ms | LLM: 6197ms | Total: 6532ms | 0 tokens*

### openai/gpt-5-mini [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** 

*Embed: 204ms | Search: 88ms | TTFT: 9412ms | LLM: 9412ms | Total: 9704ms | 0 tokens*

### openai/gpt-5.1 [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR pro Monat.

*Embed: 286ms | Search: 85ms | TTFT: 1926ms | LLM: 2059ms | Total: 2430ms | 13 tokens*

### openai/gpt-5.1 [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Im Kontext wird als Kontomodell für Privatkonten das „PremiumKonto“ mit einer Monatspauschale von 12,90 EUR genannt. Weitere Kontomodelle sind im vorliegenden Auszug nicht ersichtlich.

*Embed: 116ms | Search: 84ms | TTFT: 4893ms | LLM: 5707ms | Total: 5907ms | 46 tokens*

### openai/gpt-5.1 [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 246ms | Search: 58ms | TTFT: 1930ms | LLM: 2030ms | Total: 2334ms | 11 tokens*

### openai/gpt-5.1 [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 83ms | Search: 85ms | TTFT: 3738ms | LLM: 3787ms | Total: 3955ms | 11 tokens*

### openai/gpt-5.1 [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine beleghaft beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Zu den Kosten für online erteilte SEPA-Überweisungen liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 103ms | Search: 56ms | TTFT: 7426ms | LLM: 7542ms | Total: 7701ms | 45 tokens*

### openai/gpt-5.1 [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 440ms | Search: 86ms | TTFT: 2213ms | LLM: 2281ms | Total: 2807ms | 11 tokens*

### openai/gpt-5.1 [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag. Das Wochenlimit liegt ebenfalls bei 2.000,00 EUR. Individuell vereinbarte Limite können abweichen.

*Embed: 103ms | Search: 93ms | TTFT: 2169ms | LLM: 2334ms | Total: 2531ms | 54 tokens*

### openai/gpt-5.1 [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** 

*Embed: 80ms | Search: 54ms | TTFT: 6095ms | LLM: 6095ms | Total: 6230ms | 0 tokens*

### openai/gpt-5.1 [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 223ms | Search: 69ms | TTFT: 1952ms | LLM: 2048ms | Total: 2340ms | 11 tokens*

### openai/gpt-5.1 [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Im vorliegenden Auszug des Preis- und Leistungsverzeichnisses werden nur kostenpflichtige Kontomodelle (z. B. PremiumKonto, BasisKonto) mit monatlichen Preisen aufgeführt. Ein kostenloses Girokonto ist in diesen Unterlagen nicht genannt.

*Embed: 73ms | Search: 93ms | TTFT: 3609ms | LLM: 3827ms | Total: 3993ms | 56 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet pro Monat eine Monatspauschale von 12,90 EUR. In dieser Pauschale sind sämtliche Buchungsposten enthalten. Außerdem ist die Commerzbank Girocard für bis zu zwei Verfügungsberechtigte eingeschlossen.

*Embed: 77ms | Search: 57ms | TTFT: 2210ms | LLM: 2348ms | Total: 2482ms | 53 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** 

*Embed: 79ms | Search: 94ms | TTFT: 4441ms | LLM: 4441ms | Total: 4614ms | 0 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im bereitgestellten Kontext finden sich nur Angaben zu Mietkautionskonten sowie Kontoführungsentgelten für Privatkonten. Konkrete Preise für Bankschließfächer, insbesondere für die Größe M, sind darin nicht aufgeführt. Bitte prüfen Sie hierzu das vollständige Preis- und Leistungsverzeichnis der Bank oder fragen Sie direkt in Ihrer Filiale nach.

*Embed: 225ms | Search: 60ms | TTFT: 2880ms | LLM: 3058ms | Total: 3343ms | 88 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den vorliegenden Unterlagen finde ich nur Angaben zum PremiumKonto mit einer Monatspauschale von 12,90 EUR sowie zum StartDepot, nicht jedoch zum StartKonto für Studenten. Bitte prüfen Sie das aktuelle Preis- und Leistungsverzeichnis oder wenden Sie sich direkt an die Bank.

*Embed: 82ms | Search: 94ms | TTFT: 2464ms | LLM: 3950ms | Total: 4127ms | 71 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Für eine beleghaft beauftragte SEPA-Überweisung berechnet die Bank 2,50 EUR pro Überweisung. Der gleiche Preis von 2,50 EUR gilt laut Preisverzeichnis auch für SEPA-Echtzeitüberweisungen, wenn sie beleghaft beauftragt werden. Weitere Preise für andere SEPA-Überweisungsarten sind im vorliegenden Kontext nicht genannt. Daher kann ich nur diese Kondition sicher angeben.

*Embed: 287ms | Search: 69ms | TTFT: 2415ms | LLM: 3133ms | Total: 3488ms | 91 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** 

*Embed: 203ms | Search: 84ms | TTFT: 6209ms | LLM: 6209ms | Total: 6495ms | 0 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard liegt bei 2.000,00 EUR pro Tag. Das Wochenlimit beträgt ebenfalls 2.000,00 EUR. Im Ausland gilt ein Limit von 500,00 EUR pro Tag. Individuell vereinbarte Limite können davon abwe

*Embed: 221ms | Search: 60ms | TTFT: 3380ms | LLM: 3823ms | Total: 4105ms | 67 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen fällt für die Währungsumrechnung bei Überweisungen in einer anderen Währung als der Kontowährung ein

*Embed: 100ms | Search: 85ms | TTFT: 4821ms | LLM: 4901ms | Total: 5086ms | 28 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im vorliegenden Preisaushang werden unter anderem das PremiumKonto und verschiedene Spezialkonten wie Mietkautionskonten beschrieben. Ein KlassikKonto oder GiroKonto ist in den verfügbaren Auszügen jedoch nicht näher erläutert.

*Embed: 271ms | Search: 63ms | TTFT: 4250ms | LLM: 4641ms | Total: 4975ms | 61 tokens*

### openai/gpt-5.1 [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Im vorliegenden Preis- und Leistungsverzeichnis werden nur kostenpflichtige Kontomodelle genannt. Das PremiumKonto kostet 12,90 EUR pro Monat, das BasisKonto 6,90 EUR pro Monat. Ein kostenloses Girokonto ist in diesen Unterlagen nicht aufgeführt. Dazu liegen mir aktuell keine ausreichenden Informationen vor, ob es darüber hinaus ein kostenloses Girokonto gibt.

*Embed: 206ms | Search: 87ms | TTFT: 6211ms | LLM: 6408ms | Total: 6701ms | 80 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR pro Monat.  
Es handelt sich um eine monatliche Pauschale.

*Embed: 229ms | Search: 55ms | TTFT: 1638ms | LLM: 1964ms | Total: 2247ms | 25 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet für Privatkunden das Kontomodell PremiumKonto an.  
Weitere Kontomodelle sind im vorliegenden Kontext nicht aufgeführt.

*Embed: 183ms | Search: 80ms | TTFT: 3806ms | LLM: 4349ms | Total: 4612ms | 32 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 232ms | Search: 61ms | TTFT: 3133ms | LLM: 3277ms | Total: 3570ms | 11 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 70ms | Search: 94ms | TTFT: 2004ms | LLM: 2158ms | Total: 2322ms | 11 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Die Ausführung einer beleghaft beauftragten SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Dies gilt auch für SEPA-Echtzeitüberweisungen.

*Embed: 4893ms | Search: 61ms | TTFT: 2071ms | LLM: 2555ms | Total: 7510ms | 38 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 105ms | Search: 82ms | TTFT: 2072ms | LLM: 2208ms | Total: 2395ms | 11 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Mit der Commerzbank Girocard beträgt das Tageslimit am Geldautomaten 2.000,00 EUR.  
Das Wochenlimit liegt ebenfalls bei 2.000,00 EUR.  
Im Ausland gilt ein Limit von 500,00 EUR pro Tag.  
Individuell vereinbarte Limite können abweichen.

*Embed: 82ms | Search: 54ms | TTFT: 2915ms | LLM: 3744ms | Total: 3880ms | 66 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Überweisungseingängen fällt ein Standardabwicklungsentgelt von 2,50 EUR pro Überweisung an. Zusätzlich werden bei SHARE- oder BEN-Überweisungen transaktionsbezogene Entgelte berechnet: bis 250,00 EUR 10,00 EUR, ab 250,00 EUR 1,5 ‰ (mindestens 12,50 EUR, maximal 100,00 EUR). Bei Währungsumrechnung betragen die Kosten 7,50 EUR unter 12.500,00 EUR bzw. 1,0 ‰ ab 12.500,00 EUR. Für Eilüberweisungen fallen 15,00 EUR zzgl. fremder Kosten an.

*Embed: 84ms | Search: 85ms | TTFT: 2383ms | LLM: 3935ms | Total: 4104ms | 143 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 243ms | Search: 58ms | TTFT: 2234ms | LLM: 2403ms | Total: 2704ms | 11 tokens*

### openai/gpt-5.2-chat [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Nein, ein kostenloses Girokonto wird nicht angeboten.  
Das PremiumKonto kostet 12,90 EUR pro Monat, das BasisKonto 6,90 EUR pro Monat.

*Embed: 77ms | Search: 84ms | TTFT: 1339ms | LLM: 1743ms | Total: 1905ms | 37 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Die Monatspauschale für das PremiumKonto beträgt 12,90 EUR. Dieser Preis gilt pro Monat laut Preis- und Leistungsverzeichnis.

*Embed: 75ms | Search: 55ms | TTFT: 3669ms | LLM: 4182ms | Total: 4311ms | 30 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet im Privatkundenbereich unter anderem das PremiumKonto mit einer Monatspauschale von 12,90 EUR an, inklusive sämtlicher Buchungsposten und einer Girocard für bis zu zwei Verfügungsberechtigte. Im Wertpapierbereich gibt es zudem das Depotmodell StartDepot, bei dem die Leistungen zu fest vereinbarten Entgelten abgerechnet werden. Weitere Kontomodelle sind im vorliegenden Kontext nicht aufgeführt.

*Embed: 191ms | Search: 54ms | TTFT: 1044ms | LLM: 3133ms | Total: 3378ms | 94 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Auszügen sind keine Preise für ein Bankschließfach der Größe M enthalten.

*Embed: 229ms | Search: 98ms | TTFT: 1793ms | LLM: 2208ms | Total: 2535ms | 33 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 83ms | Search: 55ms | TTFT: 1726ms | LLM: 1860ms | Total: 1997ms | 11 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Die Ausführung einer beleghaft beauftragten SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Dieser Preis gilt auch für SEPA-Echtzeitüberweisungen.

*Embed: 94ms | Search: 79ms | TTFT: 2201ms | LLM: 2624ms | Total: 2797ms | 39 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. In dem bereitgestellten Auszug sind keine konkreten Kreditkartenmodelle oder deren Jahresentgelte genannt. Es wird lediglich erwähnt, dass Jahresentgelte im Voraus belastet und bei unterjähriger Kündigung anteilig erstattet werden. Für eine genaue Auskunft zu Modellen und Preisen benötige ich weitere Informationen aus dem Preis- und Leistungsverzeichnis.

*Embed: 98ms | Search: 57ms | TTFT: 2157ms | LLM: 3351ms | Total: 3506ms | 85 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Mit der Commerzbank Girocard beträgt das Bargeldauszahlungslimit am Geldautomaten 2.000,00 EUR pro Tag. Das Wochenlimit liegt ebenfalls bei 2.000,00 EUR. Im Ausland gilt ein Limit von 500,00 EUR pro Tag. Individuell vereinbarte Limite können davon abweichen.

*Embed: 83ms | Search: 55ms | TTFT: 2471ms | LLM: 3414ms | Total: 3552ms | 69 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen fällt bei einer Währungsumrechnung ein Entgelt von 7,50 EUR für Beträge unter 12.500,00 EUR an, ab 12.500,00 EUR werden 1,0 ‰ berechnet. Bei Überweisungseingängen setzt sich der Preis aus einem Standardabwicklungsentgelt von 2,50 EUR plus transaktionsbezogenen Entgelten zusammen. Bei SHARE- oder BEN-Überweisungen sind Beträge unter 13,00 EUR entgeltfrei, unter 250,00 EUR werden 10,00 EUR berechnet und ab 250,00 EUR 1,5 ‰, mindestens 12,50 EUR und maximal 100,00 EUR. Für eine Eilüberweisung fallen zusätzlich 15,00 EUR zzgl. fremder Kosten an.

*Embed: 77ms | Search: 85ms | TTFT: 2405ms | LLM: 4758ms | Total: 4920ms | 170 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Unterlagen sind keine Angaben zu den Konditionen oder Unterschieden zwischen KlassikKonto und GiroKonto enthalten. Bitte stellen Sie mir gern weitere Informationen oder einen passenden Auszug zur Verfügung.

*Embed: 1401ms | Search: 57ms | TTFT: 1325ms | LLM: 2078ms | Total: 3536ms | 55 tokens*

### openai/gpt-5.2-chat [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Ein kostenloses Girokonto wird nicht angeboten. Das PremiumKonto kostet 12,90 EUR pro Monat. Das BasisKonto ist für 6,90 EUR pro Monat erhältlich. Beide Modelle beinhalten definierte Leistungen im Rahmen der Kontoführung.

*Embed: 77ms | Search: 84ms | TTFT: 2049ms | LLM: 2566ms | Total: 2727ms | 51 tokens*

### openai/gpt-4o-mini [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet pro Monat 12,90 EUR.

*Embed: 77ms | Search: 64ms | TTFT: 611ms | LLM: 808ms | Total: 949ms | 13 tokens*

### openai/gpt-4o-mini [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet unter anderem das Preismodell PremiumKonto für Privatkonten an, welches eine monatliche Pauschale von 12,90 EUR umfasst. Weitere spezifische Kontomodelle sind im bereitgestellten Kontext nicht erwähnt.

*Embed: 77ms | Search: 58ms | TTFT: 562ms | LLM: 1469ms | Total: 1604ms | 51 tokens*

### openai/gpt-4o-mini [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 78ms | Search: 91ms | TTFT: 405ms | LLM: 693ms | Total: 862ms | 11 tokens*

### openai/gpt-4o-mini [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 70ms | Search: 60ms | TTFT: 556ms | LLM: 934ms | Total: 1064ms | 11 tokens*

### openai/gpt-4o-mini [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Bei Eilüberweisungen fällt ein Betrag von 15,00 EUR zzgl. fremder Kosten an.

*Embed: 78ms | Search: 54ms | TTFT: 516ms | LLM: 1289ms | Total: 1421ms | 39 tokens*

### openai/gpt-4o-mini [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 83ms | Search: 53ms | TTFT: 527ms | LLM: 698ms | Total: 835ms | 11 tokens*

### openai/gpt-4o-mini [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag.

*Embed: 211ms | Search: 53ms | TTFT: 515ms | LLM: 891ms | Total: 1156ms | 28 tokens*

### openai/gpt-4o-mini [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 122ms | Search: 85ms | TTFT: 476ms | LLM: 657ms | Total: 864ms | 11 tokens*

### openai/gpt-4o-mini [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 271ms | Search: 54ms | TTFT: 577ms | LLM: 722ms | Total: 1048ms | 11 tokens*

### openai/gpt-4o-mini [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 73ms | Search: 55ms | TTFT: 377ms | LLM: 544ms | Total: 672ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet pro Monat 12,90 EUR.

*Embed: 74ms | Search: 52ms | TTFT: 1043ms | LLM: 1444ms | Total: 1570ms | 13 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet unter anderem das PremiumKonto an, das eine Monatspauschale von 12,90 EUR hat. Weitere Kontomodelle und Details sind in unserem Preis- und Leistungsverzeichnis aufgeführt. Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 73ms | Search: 56ms | TTFT: 834ms | LLM: 2478ms | Total: 2606ms | 56 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 78ms | Search: 85ms | TTFT: 548ms | LLM: 1122ms | Total: 1284ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 79ms | Search: 57ms | TTFT: 466ms | LLM: 674ms | Total: 810ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine SEPA-Überweisung kostet pro Überweisung 2,50 EUR. Bei einer SHARE- oder BEN-Überweisung fallen zusätzliche Gebühren an, wobei Beträge unter 13,00 EUR entgeltfrei sind. Für Beträge unter 250,00 EUR beträgt die Gebühr 10,00 EUR, und ab 250,00 EUR liegt die Gebühr bei 1,5 ‰, mit einem Minimum von 12,50 EUR und einem Maximum von 100,00 EUR.

*Embed: 212ms | Search: 57ms | TTFT: 517ms | LLM: 3194ms | Total: 3463ms | 100 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 81ms | Search: 57ms | TTFT: 509ms | LLM: 664ms | Total: 802ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt täglich 2.000,00 EUR und wöchentlich 2.000,00 EUR. Das Auslandslimit pro Tag liegt bei 500,00 EUR. Individuell vereinbarte Limite können abweichen.

*Embed: 106ms | Search: 83ms | TTFT: 1366ms | LLM: 2591ms | Total: 2780ms | 64 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 85ms | Search: 55ms | TTFT: 662ms | LLM: 812ms | Total: 952ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 73ms | Search: 57ms | TTFT: 450ms | LLM: 782ms | Total: 913ms | 11 tokens*

### openai/gpt-4o-mini [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 77ms | Search: 57ms | TTFT: 579ms | LLM: 706ms | Total: 841ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet pro Monat 12,90 EUR.

*Embed: 115ms | Search: 83ms | TTFT: 393ms | LLM: 527ms | Total: 725ms | 13 tokens*

### openai/gpt-4o [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 75ms | Search: 52ms | TTFT: 401ms | LLM: 514ms | Total: 641ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 77ms | Search: 55ms | TTFT: 700ms | LLM: 934ms | Total: 1066ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 86ms | Search: 54ms | TTFT: 498ms | LLM: 564ms | Total: 704ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine SEPA-Überweisung kostet bei beleghafter Ausführung 2,50 EUR pro Überweisung.

*Embed: 82ms | Search: 85ms | TTFT: 506ms | LLM: 721ms | Total: 888ms | 22 tokens*

### openai/gpt-4o [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 77ms | Search: 58ms | TTFT: 359ms | LLM: 414ms | Total: 549ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag.

*Embed: 99ms | Search: 54ms | TTFT: 373ms | LLM: 555ms | Total: 708ms | 28 tokens*

### openai/gpt-4o [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 79ms | Search: 45ms | TTFT: 385ms | LLM: 438ms | Total: 562ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 85ms | Search: 81ms | TTFT: 359ms | LLM: 431ms | Total: 597ms | 11 tokens*

### openai/gpt-4o [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 187ms | Search: 55ms | TTFT: 347ms | LLM: 412ms | Total: 654ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 543ms | Search: 57ms | TTFT: 552ms | LLM: 629ms | Total: 1230ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet unter anderem das PremiumKonto an, das monatlich 12,90 EUR kostet. Dieses Konto beinhaltet sämtliche Buchungsposten und die Nutzung einer Girocard für bis zu zwei Verfügungsberechtigte. Zu weiteren Kontomodellen liegen mir aktuell keine Informationen vor.

*Embed: 82ms | Search: 54ms | TTFT: 438ms | LLM: 1285ms | Total: 1421ms | 60 tokens*

### openai/gpt-4o [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 101ms | Search: 66ms | TTFT: 661ms | LLM: 683ms | Total: 849ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 79ms | Search: 55ms | TTFT: 495ms | LLM: 585ms | Total: 719ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine beleghaft beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung.

*Embed: 75ms | Search: 54ms | TTFT: 472ms | LLM: 634ms | Total: 763ms | 22 tokens*

### openai/gpt-4o [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 102ms | Search: 86ms | TTFT: 391ms | LLM: 461ms | Total: 649ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000,00 EUR pro Tag.

*Embed: 93ms | Search: 54ms | TTFT: 401ms | LLM: 609ms | Total: 757ms | 28 tokens*

### openai/gpt-4o [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen können je nach Betrag und Art der Überweisung unterschiedliche Gebühren anfallen. Für eine SHARE- oder BEN-Überweisung fallen bei Beträgen unter 13,00 EUR keine Gebühren an, bei Beträgen unter 250,00 EUR beträgt die Gebühr 10,00 EUR, und bei Beträgen ab 250,00 EUR sind es 1,5 ‰, mindestens jedoch 12,50 EUR und maximal 100,00 EUR. Für die Währungsumrechnung bei Beträgen unter 12.500,00 EUR fallen 7,50 EUR an, während bei Beträgen ab 12.500,00 EUR eine Gebühr von 1,0 ‰ berechnet wird.

*Embed: 76ms | Search: 52ms | TTFT: 455ms | LLM: 2177ms | Total: 2305ms | 145 tokens*

### openai/gpt-4o [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 93ms | Search: 60ms | TTFT: 700ms | LLM: 782ms | Total: 935ms | 11 tokens*

### openai/gpt-4o [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 100ms | Search: 57ms | TTFT: 488ms | LLM: 560ms | Total: 717ms | 11 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR pro Monat.

*Embed: 559ms | Search: 81ms | TTFT: 578ms | LLM: 781ms | Total: 1421ms | 13 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet unter anderem das PremiumKonto als Kontomodell für Privatkunden an. Weitere Kontomodelle sind aus dem bereitgestellten Kontext nicht ersichtlich. Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 112ms | Search: 56ms | TTFT: 798ms | LLM: 1312ms | Total: 1481ms | 46 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 104ms | Search: 59ms | TTFT: 582ms | LLM: 732ms | Total: 895ms | 11 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im Kontext werden keine Angaben zur Monatspauschale des StartKontos für Studenten genannt.

*Embed: 77ms | Search: 54ms | TTFT: 637ms | LLM: 976ms | Total: 1107ms | 29 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine beleghafte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Für beleglose SEPA-Überweisungen mit photoTAN fallen ebenfalls 2,50 EUR an. Weitere Entgelte können je nach Betrag und Art der Überweisung variieren.

*Embed: 100ms | Search: 53ms | TTFT: 593ms | LLM: 1383ms | Total: 1536ms | 58 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im vorliegenden Kontext sind keine vollständigen Angaben zu den Kreditkartenmodellen und deren Kosten enthalten.

*Embed: 113ms | Search: 85ms | TTFT: 609ms | LLM: 951ms | Total: 1149ms | 31 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt pro Tag 2.000 Euro und pro Woche 2.000 Euro. Im Ausland liegt das Tageslimit bei 500 Euro.

*Embed: 70ms | Search: 54ms | TTFT: 645ms | LLM: 1298ms | Total: 1423ms | 45 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen fallen folgende Gebühren an: Für Beträge unter 12.500 EUR beträgt die Gebühr 7,50 EUR, ab 12.500 EUR 1,0 ‰ des Betrags. Zusätzlich können fremde Kosten anfallen, zum Beispiel bei Eilüberweisungen (15,00 EUR zzgl. fremder Kosten). Weitere Details zur genauen Gebührenhöhe sind abhängig vom Überweisungsauftrag.

*Embed: 1206ms | Search: 52ms | TTFT: 821ms | LLM: 2306ms | Total: 3564ms | 88 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. Im bereitgestellten Kontext werden KlassikKonto und GiroKonto nicht beschrieben oder gegenübergestellt.

*Embed: 127ms | Search: 91ms | TTFT: 1326ms | LLM: 1687ms | Total: 1904ms | 31 tokens*

### openai/gpt-4.1-mini [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor. In den bereitgestellten Dokumenten werden Kontomodelle mit monatlichen Pauschalen genannt, ein kostenloses Girokonto wird nicht erwähnt.

*Embed: 115ms | Search: 59ms | TTFT: 617ms | LLM: 1175ms | Total: 1348ms | 40 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 Euro pro Monat.

*Embed: 736ms | Search: 54ms | TTFT: 560ms | LLM: 710ms | Total: 1500ms | 13 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 76ms | Search: 83ms | TTFT: 560ms | LLM: 728ms | Total: 887ms | 11 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 107ms | Search: 52ms | TTFT: 676ms | LLM: 1132ms | Total: 1290ms | 11 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 77ms | Search: 55ms | TTFT: 630ms | LLM: 744ms | Total: 877ms | 11 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine beleghafte oder per Online Banking mit photoTAN beauftragte SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Beträge unter 13,00 EUR bei SHARE- oder BEN-Überweisungen sind entgeltfrei, bei Beträgen unter 250,00 EUR fallen 10,00 EUR und ab 250,00 EUR 1,5 ‰ (mindestens 12,50 EUR, maximal 100,00 EUR) an. Für Eilüberweisungen kommen 15,00 EUR zzgl. fremder Kosten hinzu.

*Embed: 300ms | Search: 60ms | TTFT: 706ms | LLM: 2267ms | Total: 2627ms | 118 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 77ms | Search: 53ms | TTFT: 1151ms | LLM: 1265ms | Total: 1396ms | 11 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit der Commerzbank Girocard beträgt 2.000 Euro pro Tag und 2.000 Euro pro Woche, im Ausland sind maximal 500 Euro pro Tag möglich.

*Embed: 80ms | Search: 83ms | TTFT: 1125ms | LLM: 1839ms | Total: 2002ms | 45 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen fallen für Beträge unter 12.500 EUR 7,50 EUR an Gebühren an. Ab 12.500 EUR wird ein Entgelt von 1,0 ‰ des Betrags berechnet. Zusätzlich können fremde Kosten und gegebenenfalls ein Repair-Entgelt von 10,00 EUR bei fehlerhaften Aufträgen anfallen.

*Embed: 128ms | Search: 83ms | TTFT: 1129ms | LLM: 2155ms | Total: 2366ms | 77 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 74ms | Search: 58ms | TTFT: 724ms | LLM: 856ms | Total: 988ms | 11 tokens*

### openai/gpt-4.1-mini [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 435ms | Search: 98ms | TTFT: 1180ms | LLM: 1341ms | Total: 1874ms | 11 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR pro Monat.

*Embed: 111ms | Search: 57ms | TTFT: 461ms | LLM: 545ms | Total: 712ms | 13 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Die Senacor Bank bietet das PremiumKonto mit einer monatlichen Pauschale von 12,90 EUR an. Es sind keine weiteren Kontomodelle in den verfügbaren Dokumenten genannt.

*Embed: 106ms | Search: 58ms | TTFT: 720ms | LLM: 1093ms | Total: 1258ms | 40 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 135ms | Search: 59ms | TTFT: 639ms | LLM: 778ms | Total: 972ms | 11 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 74ms | Search: 55ms | TTFT: 551ms | LLM: 671ms | Total: 801ms | 11 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine SEPA-Überweisung kostet 2,50 EUR bei Online-Banking mit photoTAN. Für beleghafte Beauftragungen oder Echtzeitüberweisungen gilt ebenfalls ein Preis von 2,50 EUR.

*Embed: 77ms | Search: 82ms | TTFT: 856ms | LLM: 1358ms | Total: 1517ms | 46 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 120ms | Search: 59ms | TTFT: 571ms | LLM: 750ms | Total: 928ms | 11 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit Girocard beträgt 122.000 EUR pro Tag.

*Embed: 155ms | Search: 55ms | TTFT: 434ms | LLM: 610ms | Total: 820ms | 22 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Auslandsüberweisungen fallen Gebühren von 7,50 EUR für Beträge unter 12.500 EUR an, sowie 1,0 ‰ bei Beträgen ab 12.500 EUR. Es fallen außerdem fremde Kosten für Eilüberweisungen in Höhe von 15,00 EUR pro Überweisung an. Bei beleglosen Aufträgen, die nicht maschinell verarbeitet werden können, gibt es ein Repair-Entgelt von 10,00 EUR.

*Embed: 72ms | Search: 58ms | TTFT: 493ms | LLM: 1552ms | Total: 1682ms | 96 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 83ms | Search: 53ms | TTFT: 482ms | LLM: 592ms | Total: 727ms | 11 tokens*

### openai/gpt-4.1-nano [current]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Ja, es gibt ein BasisKonto, das monatlich 6,90 EUR kostet. Ein kostenloses Girokonto war im bereitgestellten Kontekt nicht erwähnt.

*Embed: 78ms | Search: 85ms | TTFT: 680ms | LLM: 1463ms | Total: 1626ms | 35 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Was kostet das PremiumKonto pro Monat?

**A:** Das PremiumKonto kostet 12,90 EUR monatlich.

*Embed: 71ms | Search: 55ms | TTFT: 479ms | LLM: 627ms | Total: 753ms | 13 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Welche Kontomodelle bietet die Senacor Bank an?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 82ms | Search: 57ms | TTFT: 591ms | LLM: 699ms | Total: 838ms | 11 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Was kostet ein Bankschließfach in der Größe M?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 83ms | Search: 58ms | TTFT: 655ms | LLM: 688ms | Total: 829ms | 11 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Wie hoch ist die Monatspauschale beim StartKonto für Studenten?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 73ms | Search: 57ms | TTFT: 452ms | LLM: 586ms | Total: 716ms | 11 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Was kostet eine SEPA-Überweisung?

**A:** Eine SEPA-Überweisung kostet 2,50 EUR pro Überweisung. Bei photoTAN-Ausführung, beleghaft beauftragter SEPA-Überweisung oder SEPA-Echtzeitüberweisung sind ebenfalls 2,50 EUR fällig. Eilüberweisungen in diesem Bereich kosten zusätzlich 15,00 EUR.

*Embed: 80ms | Search: 55ms | TTFT: 469ms | LLM: 1264ms | Total: 1399ms | 68 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Welche Kreditkartenmodelle gibt es und was kosten sie?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 71ms | Search: 84ms | TTFT: 540ms | LLM: 667ms | Total: 823ms | 11 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Wie hoch ist das Bargeldauszahlungslimit am Geldautomaten mit Girocard?

**A:** Das Bargeldauszahlungslimit am Geldautomaten mit Girocard beträgt 122.000 EUR pro Tag.

*Embed: 101ms | Search: 59ms | TTFT: 764ms | LLM: 870ms | Total: 1030ms | 22 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Welche Gebühren fallen bei Auslandsüberweisungen an?

**A:** Bei Währungsumrechnungen bei Überweisungen in einer anderen Währung als der Kontowährung fallen 7,50 EUR bei Beträgen unter 12.500 EUR und 1,0 ‰ bei Beträgen ab 12.500 EUR an. Für eine Eilüberweisung werden zusätzlich 15,00 EUR zzgl. fremder Kosten berechnet.

*Embed: 75ms | Search: 59ms | TTFT: 601ms | LLM: 1346ms | Total: 1480ms | 75 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Was ist der Unterschied zwischen KlassikKonto und GiroKonto?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 89ms | Search: 55ms | TTFT: 582ms | LLM: 679ms | Total: 823ms | 11 tokens*

### openai/gpt-4.1-nano [optimized]

**Q:** Gibt es ein kostenloses Girokonto bei der Senacor Bank?

**A:** Dazu liegen mir aktuell keine ausreichenden Informationen vor.

*Embed: 133ms | Search: 55ms | TTFT: 614ms | LLM: 730ms | Total: 917ms | 11 tokens*
