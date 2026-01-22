#!/usr/bin/env python3
"""
Script zum Hinzufügen einer Function zu einem Azure AI Foundry Agent.

Usage:
    python add_agent_function.py
"""

import os
import sys
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables
load_dotenv()

# Configuration
AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"

# Option 1: Aus .env Datei laden
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")

# Option 2: Direkt hier eintragen (für schnellen Test)
# AZURE_OPENAI_ENDPOINT = "https://anton-233444-resource.openai.azure.com"
# AZURE_OPENAI_API_KEY = "your-api-key-here"

API_VERSION = "2024-12-01-preview"  # Assistants API Version

# Function Definition für Überweisungsbestätigung
TRANSFER_FUNCTION = {
    "type": "function",
    "function": {
        "name": "ueberweisung_bestaetigen",
        "description": "Zeigt eine Überweisungsbestätigung im UI an, wenn der Benutzer eine Überweisung durchführen möchte. Der Benutzer kann die Überweisung dann über das UI bestätigen oder ablehnen.",
        "parameters": {
            "type": "object",
            "properties": {
                "recipient": {
                    "type": "string",
                    "description": "Name des Empfängers der Überweisung"
                },
                "iban": {
                    "type": "string",
                    "description": "IBAN des Empfängers (z.B. DE89370400440532013000)"
                },
                "amount": {
                    "type": "number",
                    "description": "Betrag in Euro (z.B. 100.50)"
                },
                "currency": {
                    "type": "string",
                    "description": "Währung der Überweisung",
                    "default": "EUR",
                    "enum": ["EUR", "USD", "CHF"]
                },
                "purpose": {
                    "type": "string",
                    "description": "Verwendungszweck der Überweisung"
                }
            },
            "required": ["recipient", "iban", "amount"]
        }
    }
}


def add_function_to_agent():
    """Fügt die Überweisungs-Function zu Agent941 hinzu."""
    
    # Validate configuration
    if not AZURE_OPENAI_ENDPOINT:
        print("❌ Fehler: AZURE_OPENAI_ENDPOINT nicht gesetzt!")
        print("Setze in .env: AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com")
        sys.exit(1)
    
    if not AZURE_OPENAI_API_KEY:
        print("❌ Fehler: AZURE_OPENAI_API_KEY nicht gesetzt!")
        sys.exit(1)
    
    print("=" * 60)
    print("🔧 Azure AI Agent Function Konfiguration")
    print("=" * 60)
    print(f"Agent ID: {AGENT_ID}")
    print(f"Endpoint: {AZURE_OPENAI_ENDPOINT}")
    print(f"Function: {TRANSFER_FUNCTION['function']['name']}")
    print("=" * 60)
    print()
    
    try:
        # Initialize Azure OpenAI Client
        print("📡 Verbinde mit Azure OpenAI Assistants API...")
        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        
        # Retrieve current agent
        print(f"📥 Lade Agent {AGENT_ID}...")
        agent = client.beta.assistants.retrieve(assistant_id=AGENT_ID)
        
        print(f"✅ Agent gefunden: {agent.name}")
        print(f"   Model: {agent.model}")
        print(f"   Instructions (first 100 chars): {agent.instructions[:100] if agent.instructions else 'N/A'}...")
        print(f"   Aktuelle Tools: {len(agent.tools)}")
        print()
        
        # Check if function already exists
        existing_functions = [
            tool.function.name 
            for tool in agent.tools 
            if hasattr(tool, 'function')
        ]
        
        if TRANSFER_FUNCTION['function']['name'] in existing_functions:
            print(f"⚠️  Function '{TRANSFER_FUNCTION['function']['name']}' existiert bereits!")
            print("   Möchtest du sie aktualisieren? (y/n): ", end="")
            response = input().strip().lower()
            if response != 'y':
                print("Abgebrochen.")
                return
            
            # Remove old version
            new_tools = [
                tool for tool in agent.tools 
                if not (hasattr(tool, 'function') and tool.function.name == TRANSFER_FUNCTION['function']['name'])
            ]
        else:
            new_tools = list(agent.tools)
        
        # Add new function
        new_tools.append(TRANSFER_FUNCTION)
        
        print(f"🔧 Aktualisiere Agent mit neuer Function...")
        updated_agent = client.beta.assistants.update(
            assistant_id=AGENT_ID,
            tools=new_tools
        )
        
        print()
        print("=" * 60)
        print("✅ Agent erfolgreich aktualisiert!")
        print("=" * 60)
        print(f"Agent: {updated_agent.name} ({updated_agent.id})")
        print(f"Tools gesamt: {len(updated_agent.tools)}")
        print()
        print("Verfügbare Functions:")
        for tool in updated_agent.tools:
            if hasattr(tool, 'function'):
                print(f"  ✓ {tool.function.name}")
                print(f"    → {tool.function.description[:80]}...")
        print()
        print("=" * 60)
        print("🎉 Fertig! Du kannst jetzt sagen:")
        print("   'Ich möchte 100 Euro an Max Mustermann überweisen'")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Fehler: {e}")
        print()
        print("Mögliche Ursachen:")
        print("1. Falscher AZURE_OPENAI_ENDPOINT (sollte *.openai.azure.com sein)")
        print("2. Falscher API Key")
        print("3. Agent-ID existiert nicht")
        print("4. Keine Berechtigung zum Bearbeiten des Agents")
        sys.exit(1)


if __name__ == "__main__":
    print()
    add_function_to_agent()

