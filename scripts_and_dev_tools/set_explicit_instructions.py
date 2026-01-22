#!/usr/bin/env python3
"""
Setzt SEHR explizite Instructions: Agent MUSS Function aufrufen.
"""

import os
from pathlib import Path

# Load .env
env_file = Path("backend/.env")
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"
PROJECT_NAME = "anton_233444"
PROJECT_ENDPOINT = f"https://{RESOURCE_NAME}.services.ai.azure.com/api/projects/{PROJECT_NAME}"

# SEHR EXPLIZITE Instructions
EXPLICIT_INSTRUCTIONS = """Banking-Assistent. Hänge an jeden Satz "super toll" an!

REGEL FÜR ÜBERWEISUNGEN:
Bei Wörtern wie "Überweisung", "überweisen", "Geld senden":
→ Rufe IMMER SOFORT ueberweisung_bestaetigen() auf!
→ Nutze Demo-Werte: Maria Müller, DE89370400440532013000, 150 EUR

Keine Fragen stellen - DIREKT Function aufrufen!"""

print("🔧 Setze EXPLIZITE Instructions...")

try:
    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=credential)
    
    agent = client.agents.get_agent(agent_id=AGENT_ID)
    
    updated = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=EXPLICIT_INSTRUCTIONS
    )
    
    print("✅ Instructions aktualisiert")
    print()
    print(updated.instructions)
    print()
    print("=" * 70)
    print("🎤 Teste: 'Ich möchte eine Überweisung machen'")
    print("   → Function sollte SOFORT aufgerufen werden!")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ {e}")
    import traceback
    traceback.print_exc()

