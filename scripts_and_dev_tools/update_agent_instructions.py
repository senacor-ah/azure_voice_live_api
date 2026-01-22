#!/usr/bin/env python3
"""
Aktualisiert die Instructions von Agent941 für Überweisungen.
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
    print("❌ Packages fehlen! Führe aus: pip install azure-ai-projects azure-identity")
    sys.exit(1)

# Configuration
AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"
PROJECT_NAME = "anton_233444"
PROJECT_ENDPOINT = f"https://{RESOURCE_NAME}.services.ai.azure.com/api/projects/{PROJECT_NAME}"

# Neue Instructions (erweitert um Überweisungs-Logik)
NEW_INSTRUCTIONS = """Du bist Agent941, ein hilfreicher Voice-Assistent für Banking-Operationen.

WICHTIGE VERHALTENSREGEL:
Du hängst an jeden Satz den du sagst ein "super toll" an!!!!

ÜBERWEISUNGEN:
Wenn der Benutzer eine Überweisung machen möchte:

1. Sammle ALLE erforderlichen Informationen:
   - Empfänger (Name)
   - IBAN (vollständig)
   - Betrag (Zahl in Euro)
   - Verwendungszweck

2. Frage höflich nach fehlenden Informationen:
   - "An wen möchten Sie überweisen?"
   - "Wie lautet die IBAN des Empfängers?"
   - "Welchen Betrag möchten Sie überweisen?"
   - "Was soll als Verwendungszweck angegeben werden?"

3. Sobald du ALLE Daten hast, rufe die Function auf:
   ueberweisung_bestaetigen(
     recipient="Name",
     iban="DE...",
     amount=100.00,
     currency="EUR",
     purpose="Verwendungszweck"
   )

4. Sage dem Benutzer:
   "Ich zeige Ihnen jetzt die Überweisungsdetails zur Bestätigung an, super toll!"

5. WARTE auf das Function-Result (approved: true/false)

6. Nach der Bestätigung:
   - Wenn approved=true: "Ihre Überweisung wurde durchgeführt, super toll!"
   - Wenn approved=false: "Okay, ich habe die Überweisung abgebrochen, super toll!"

ALLGEMEINE REGELN:
- Halte Antworten kurz und präzise (2-3 Sätze)
- Sprich natürlich und freundlich
- Nutze den Namen des Benutzers gelegentlich
- Vergiss nicht "super toll" am Ende jedes Satzes!
"""

print("=" * 70)
print("📝 Aktualisiere Agent941 Instructions")
print("=" * 70)
print(f"Agent ID: {AGENT_ID}")
print(f"Project:  {PROJECT_NAME}")
print("=" * 70)
print()

try:
    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=credential)
    
    print("📥 Rufe aktuellen Agent ab...")
    agent = client.agents.get_agent(agent_id=AGENT_ID)
    
    print(f"✅ Agent gefunden: {agent.name}")
    print()
    print("Aktuelle Instructions:")
    print("-" * 70)
    print(agent.instructions if agent.instructions else "(Keine)")
    print("-" * 70)
    print()
    
    print("Möchtest du die Instructions aktualisieren? (y/n): ", end="")
    response = input().strip().lower()
    
    if response != 'y':
        print("Abgebrochen.")
        sys.exit(0)
    
    print()
    print("🔧 Aktualisiere Instructions...")
    
    updated_agent = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=NEW_INSTRUCTIONS
    )
    
    print()
    print("=" * 70)
    print("✅ ERFOLGREICH AKTUALISIERT!")
    print("=" * 70)
    print()
    print("Neue Instructions:")
    print("-" * 70)
    print(updated_agent.instructions[:500])
    print("...")
    print("-" * 70)
    print()
    print("=" * 70)
    print("🎉 Agent941 ist jetzt bereit für Überweisungen!")
    print("=" * 70)
    
except EOFError:
    print("\n❌ Kein interaktiver Input möglich")
    print()
    print("Führe das Script direkt im Terminal aus:")
    print("  cd /Users/Anton.Happel/Documents/Projects/azure_voicelive")
    print("  python3.11 update_agent_instructions.py")
    sys.exit(1)
except Exception as e:
    print(f"❌ Fehler: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

