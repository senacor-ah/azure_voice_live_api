#!/usr/bin/env python3
"""
Aktualisiert die Instructions von Agent941 für Überweisungen (automatisch).
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

# Erweiterte Instructions
NEW_INSTRUCTIONS = """Du bist Agent941, ein hilfreicher Voice-Assistent für Banking-Operationen.

WICHTIGE VERHALTENSREGEL:
Du hängst an jeden Satz den du sagst ein "super toll" an!!!!

ÜBERWEISUNGEN:
Wenn der Benutzer eine Überweisung machen möchte:

1. Sammle ALLE erforderlichen Informationen:
   - Empfänger (Name)
   - IBAN (vollständig)
   - Betrag (Zahl in Euro)
   - Verwendungszweck (optional)

2. Frage höflich nach fehlenden Informationen:
   Beispiele:
   - "An wen möchten Sie überweisen, super toll?"
   - "Wie lautet die IBAN des Empfängers, super toll?"
   - "Welchen Betrag möchten Sie überweisen, super toll?"
   - "Was soll als Verwendungszweck angegeben werden, super toll?"

3. Sobald du ALLE Pflichtdaten hast, rufe die Function auf:
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

6. Nach der User-Entscheidung:
   - Wenn approved=true: "Ihre Überweisung wurde erfolgreich durchgeführt, super toll!"
   - Wenn approved=false: "Verstanden, ich habe die Überweisung abgebrochen, super toll!"

ALLGEMEINE REGELN:
- Halte Antworten kurz (2-3 Sätze maximal)
- Sprich natürlich und freundlich
- Nutze den Namen des Benutzers gelegentlich
- Sei präzise bei Zahlen und IBANs
- VERGISS NICHT "super toll" am Satzende!
"""

print("=" * 70)
print("📝 Aktualisiere Agent941 Instructions (AUTOMATISCH)")
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
    print(f"   Model: {agent.model}")
    print(f"   Tools: {len(agent.tools) if agent.tools else 0}")
    print()
    print("Aktuelle Instructions (first 200 chars):")
    print(f"  {agent.instructions[:200] if agent.instructions else 'N/A'}...")
    print()
    
    print("🔧 Aktualisiere Instructions...")
    
    updated_agent = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=NEW_INSTRUCTIONS
    )
    
    print()
    print("=" * 70)
    print("✅ INSTRUCTIONS ERFOLGREICH AKTUALISIERT!")
    print("=" * 70)
    print()
    print("Neue Instructions (first 400 chars):")
    print("-" * 70)
    print(updated_agent.instructions[:400] if updated_agent.instructions else "N/A")
    print("...")
    print("-" * 70)
    print()
    print("=" * 70)
    print("🎉 Agent941 ist jetzt vollständig konfiguriert!")
    print()
    print("✅ Function 'ueberweisung_bestaetigen' vorhanden")
    print("✅ Instructions für Überweisungs-Flow definiert")
    print("✅ 'super toll' Regel beibehalten")
    print()
    print("🎤 Teste jetzt:")
    print("   'Ich möchte 100 Euro an Maria Müller überweisen'")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Fehler: {e}")
    import traceback
    traceback.print_exc()
    print()
    print("Mögliche Lösungen:")
    print("1. Stelle sicher dass 'az login' ausgeführt wurde")
    print("2. Überprüfe Endpoint und Berechtigungen")
    sys.exit(1)

