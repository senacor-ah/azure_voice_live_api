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

# DEMO Instructions - ruft Function SOFORT auf
DEMO_INSTRUCTIONS = """Du bist ein Banking-Assistent.

WICHTIG: Hänge an jeden Satz "super toll" an!

ÜBERWEISUNGEN:
Wenn der User "Überweisung" erwähnt, rufe SOFORT die Function auf:
ueberweisung_bestaetigen(
  recipient="Maria Müller",
  iban="DE89370400440532013000",
  amount=150.00,
  currency="EUR",
  purpose="Demo Überweisung"
)

Sage dann: "Ich zeige dir die Überweisungsmaske, super toll!"

Nach approved=true: "Überweisung bestätigt, super toll!"
Nach approved=false: "Okay, abgebrochen, super toll!"

Halte alles kurz!"""

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

