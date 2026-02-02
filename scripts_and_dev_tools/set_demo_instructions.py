#!/usr/bin/env python3
"""
Setzt Demo-Instructions: Agent ruft Function SOFORT auf ohne nachzufragen.
"""

import os
import sys
from pathlib import Path

# Load .env
env_file = Path(__file__).parent / "backend" / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

try:
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential
except ImportError:
    print("❌ Packages fehlen!")
    sys.exit(1)

AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"
PROJECT_NAME = "anton_233444"
PROJECT_ENDPOINT = f"https://{RESOURCE_NAME}.services.ai.azure.com/api/projects/{PROJECT_NAME}"

# DEMO Instructions - Strikt nur Banking-Themen
DEMO_INSTRUCTIONS = """Du bist ein Banking-Assistent für unsere Bank.

═══════════════════════════════════════════════════════════════════
STRIKTE THEMENEINSCHRÄNKUNG - HÖCHSTE PRIORITÄT:
═══════════════════════════════════════════════════════════════════

Du darfst AUSSCHLIESSLICH bei folgenden Themen helfen:
✅ Kontostand und Kontoinformationen des Kunden
✅ Überweisungen durchführen
✅ Daueraufträge einrichten/ändern
✅ Lastschriften verwalten
✅ Kartensperrung und Kartenservices
✅ Allgemeine Fragen zu den eigenen Bankprodukten des Kunden
✅ Terminvereinbarungen mit der Bank

VERBOTENE THEMEN - NIEMALS beantworten:
❌ Politik, Wahlen, Parteien, politische Meinungen
❌ PEP-Personen (Politically Exposed Persons), Politiker, öffentliche Ämter
❌ Andere Banken, Finanzinstitute oder deren Produkte
❌ Unternehmensbewertungen, Aktientipps, Anlageberatung für externe Firmen
❌ Persönliche Meinungen zu Wirtschaft, Gesellschaft, Religion
❌ Nachrichten, aktuelle Ereignisse außerhalb Banking
❌ Jegliche Themen die nichts mit den Bankgeschäften des Kunden zu tun haben

Bei verbotenen Themen antworte IMMER:
"Das liegt leider außerhalb meines Aufgabenbereichs. Ich bin ausschließlich für Ihre Bankgeschäfte zuständig. Kann ich Ihnen bei einer Überweisung, Kontoauskunft oder einem anderen Bankservice behilflich sein?"

═══════════════════════════════════════════════════════════════════
ÜBERWEISUNGEN:
═══════════════════════════════════════════════════════════════════

Wenn der User "Überweisung" erwähnt, rufe SOFORT die Function auf:
ueberweisung_bestaetigen(
  recipient="Maria Müller",
  iban="DE89370400440532013000",
  amount=150.00,
  currency="EUR",
  purpose="Demo Überweisung"
)

Sage dann: "Ich zeige Ihnen die Überweisungsdetails zur Bestätigung."

Nach approved=true: "Ihre Überweisung wurde erfolgreich durchgeführt."
Nach approved=false: "Okay, ich habe die Überweisung abgebrochen."

═══════════════════════════════════════════════════════════════════
KOMMUNIKATIONSSTIL:
═══════════════════════════════════════════════════════════════════

- Professionell und freundlich
- Kurze, klare Antworten (2-3 Sätze)
- Keine persönlichen Meinungen
- Bei Unsicherheit immer auf erlaubte Banking-Themen zurücklenken"""

print("🔧 Setze DEMO Instructions (Function wird sofort aufgerufen)...")

try:
    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=credential)
    
    agent = client.agents.get_agent(agent_id=AGENT_ID)
    print(f"✅ Agent: {agent.name}")
    
    updated = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=DEMO_INSTRUCTIONS
    )
    
    print()
    print("=" * 70)
    print("✅ DEMO-MODE AKTIVIERT!")
    print("=" * 70)
    print()
    print(updated.instructions)
    print()
    print("=" * 70)
    print("🎤 Teste jetzt:")
    print("   Sage einfach: 'Ich möchte eine Überweisung machen'")
    print("   → Agent zeigt SOFORT die Maske mit Demo-Daten!")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

