#!/usr/bin/env python3
"""
Fügt eine Function zu einem Azure AI Services Agent hinzu.
Nutzt Azure AI SDK (nicht OpenAI SDK).
"""

import os
import sys
from pathlib import Path

# Load .env manually
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
    print("❌ Azure AI SDK nicht installiert!")
    print("Führe aus: pip install azure-ai-projects azure-identity")
    sys.exit(1)

# Configuration
PROJECT_CONNECTION_STRING = os.getenv("AZURE_AI_PROJECT_CONNECTION_STRING", "")
AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"

# Falls kein Connection String, versuche aus Einzelteilen zu bauen
if not PROJECT_CONNECTION_STRING:
    subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID", "")
    resource_group = os.getenv("AZURE_RESOURCE_GROUP", "")
    project_name = os.getenv("AZURE_AI_PROJECT_NAME", "anton_233444")
    
    if subscription_id and resource_group and project_name:
        PROJECT_CONNECTION_STRING = (
            f"subscriptions/{subscription_id}/"
            f"resourceGroups/{resource_group}/"
            f"providers/Microsoft.MachineLearningServices/"
            f"workspaces/{project_name}"
        )

# Function Definition
TRANSFER_FUNCTION = {
    "name": "ueberweisung_bestaetigen",
    "description": "Zeigt eine Überweisungsbestätigung im UI an, wenn der Benutzer eine Überweisung durchführen möchte.",
    "parameters": {
        "type": "object",
        "properties": {
            "recipient": {
                "type": "string",
                "description": "Name des Empfängers"
            },
            "iban": {
                "type": "string", 
                "description": "IBAN des Empfängers"
            },
            "amount": {
                "type": "number",
                "description": "Betrag in Euro"
            },
            "currency": {
                "type": "string",
                "description": "Währung",
                "default": "EUR"
            },
            "purpose": {
                "type": "string",
                "description": "Verwendungszweck"
            }
        },
        "required": ["recipient", "iban", "amount"]
    }
}

print("=" * 70)
print("🔧 Azure AI Agent Function Hinzufügen")
print("=" * 70)
print(f"Agent ID: {AGENT_ID}")
print()

if not PROJECT_CONNECTION_STRING:
    print("❌ Azure AI Project Connection String nicht konfiguriert!")
    print()
    print("Setze in .env eine der folgenden Optionen:")
    print()
    print("Option 1 - Connection String:")
    print("AZURE_AI_PROJECT_CONNECTION_STRING=...")
    print()
    print("Option 2 - Einzelne Werte:")
    print("AZURE_SUBSCRIPTION_ID=...")
    print("AZURE_RESOURCE_GROUP=...")
    print("AZURE_AI_PROJECT_NAME=anton_233444")
    print()
    print("Tipp: Connection String findest du in Azure AI Foundry:")
    print("  → https://ai.azure.com")
    print("  → Dein Projekt → Settings → Connection String")
    sys.exit(1)

try:
    print("📡 Verbinde mit Azure AI Project...")
    credential = DefaultAzureCredential()
    
    # Das ist die theoretische API - könnte anders sein!
    print("⚠️  HINWEIS: Azure AI Services Agents haben evtl. keine")
    print("   programmatische API zum Hinzufügen von Functions!")
    print()
    print("   Functions müssen wahrscheinlich über das Portal konfiguriert werden:")
    print("   → https://ai.azure.com")
    print("   → Projekt anton_233444")
    print("   → Agents → Agent941")
    print("   → Functions/Tools hinzufügen")
    print()
    
    # TODO: Sobald Azure AI SDK dokumentiert ist, hier implementieren
    print("=" * 70)
    print("📝 Manuelle Konfiguration erforderlich")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Fehler: {e}")
    sys.exit(1)

