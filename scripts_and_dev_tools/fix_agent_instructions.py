#!/usr/bin/env python3
"""
Setzt kürzere, Voice-optimierte Instructions für Agent941.
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

# KÜRZERE, Voice-optimierte Instructions
SHORT_INSTRUCTIONS = """Du bist ein hilfreicher Banking-Assistent.

WICHTIG: Hänge an jeden Satz "super toll" an!

ÜBERWEISUNGEN:
- Frage nach: Empfänger, IBAN, Betrag, Verwendungszweck
- Rufe dann ueberweisung_bestaetigen() auf
- Warte auf Bestätigung
- Reagiere auf approved=true/false

Halte Antworten sehr kurz!"""

print("🔧 Setze kürzere Instructions...")

try:
    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=credential)
    
    agent = client.agents.get_agent(agent_id=AGENT_ID)
    print(f"✅ Agent: {agent.name}")
    
    updated = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=SHORT_INSTRUCTIONS
    )
    
    print("✅ Instructions aktualisiert auf kürzere Version")
    print(f"   Länge: {len(SHORT_INSTRUCTIONS)} Zeichen")
    print()
    print(updated.instructions)
    
except Exception as e:
    print(f"❌ {e}")
    sys.exit(1)

