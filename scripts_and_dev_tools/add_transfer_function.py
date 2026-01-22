#!/usr/bin/env python3
"""
Fügt die Überweisungsbestätigungs-Function zu Agent941 hinzu.
Nutzt Azure AI Projects SDK.
"""

import os
import sys
import json
from pathlib import Path

# Load .env manually
env_file = Path(__file__).parent / "backend" / ".env"
if env_file.exists():
    print(f"📂 Lade .env: {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    print("✅ .env geladen\n")

try:
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential
    from azure.ai.agents.models import FunctionToolDefinition, FunctionDefinition
except ImportError as e:
    print(f"❌ Fehler beim Import: {e}")
    print("\nInstalliere erforderliche Packages:")
    print("  pip install azure-ai-projects azure-identity")
    sys.exit(1)

# Configuration
AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"
PROJECT_NAME = os.getenv("AZURE_AI_PROJECT_NAME", "anton_233444")

# Azure AI Foundry Project Endpoint (korrekt!)
PROJECT_ENDPOINT = f"https://{RESOURCE_NAME}.services.ai.azure.com/api/projects/{PROJECT_NAME}"

print("=" * 70)
print("🔧 Füge Überweisungs-Function zu Agent941 hinzu")
print("=" * 70)
print(f"Agent ID:         {AGENT_ID}")
print(f"Project:          {PROJECT_NAME}")
print(f"Project Endpoint: {PROJECT_ENDPOINT}")
print("=" * 70)
print()

try:
    # 1. Verbinde mit Azure AI Project
    print("📡 Verbinde mit Azure AI Project...")
    print("   (Nutzt DefaultAzureCredential - stelle sicher, dass 'az login' ausgeführt wurde)")
    print()
    
    credential = DefaultAzureCredential()
    
    client = AIProjectClient(
        endpoint=PROJECT_ENDPOINT,
        credential=credential
    )
    
    print("✅ Verbindung hergestellt")
    print()
    
    # 2. Agent abrufen
    print(f"📥 Rufe Agent {AGENT_ID} ab...")
    agent = client.agents.get_agent(agent_id=AGENT_ID)
    
    print(f"✅ Agent gefunden: {agent.name}")
    print(f"   Model: {agent.model}")
    print(f"   Instructions: {agent.instructions[:100] if agent.instructions else 'N/A'}...")
    print(f"   Aktuelle Tools: {len(agent.tools) if agent.tools else 0}")
    print()
    
    # 3. Überprüfe existierende Functions
    existing_tools = agent.tools if agent.tools else []
    existing_function_names = [
        tool.function.name 
        for tool in existing_tools 
        if hasattr(tool, 'function') and hasattr(tool.function, 'name')
    ]
    
    if existing_function_names:
        print("Existierende Functions:")
        for name in existing_function_names:
            print(f"  🔧 {name}")
        print()
    
    # 4. Erstelle Function Definition
    print("🔨 Erstelle Function Definition...")
    
    function_def = FunctionDefinition(
        name="ueberweisung_bestaetigen",
        description="Zeigt eine Überweisungsbestätigung im UI an, wenn der Benutzer eine Überweisung durchführen möchte. Der Benutzer kann die Überweisung dann bestätigen oder ablehnen.",
        parameters={
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
                    "description": "Währung der Überweisung (EUR, USD, CHF)",
                    "default": "EUR"
                },
                "purpose": {
                    "type": "string",
                    "description": "Verwendungszweck der Überweisung"
                }
            },
            "required": ["recipient", "iban", "amount"]
        }
    )
    
    transfer_tool = FunctionToolDefinition(function=function_def)
    print("✅ Function Definition erstellt")
    print()
    
    # 5. Tools-Liste aktualisieren
    if "ueberweisung_bestaetigen" in existing_function_names:
        print("⚠️  Function 'ueberweisung_bestaetigen' existiert bereits - wird aktualisiert")
        new_tools = [
            tool for tool in existing_tools 
            if not (hasattr(tool, 'function') and 
                   hasattr(tool.function, 'name') and 
                   tool.function.name == "ueberweisung_bestaetigen")
        ]
        new_tools.append(transfer_tool)
    else:
        print("✅ Füge neue Function hinzu")
        new_tools = list(existing_tools)
        new_tools.append(transfer_tool)
    
    print(f"   Neue Tool-Anzahl: {len(new_tools)}")
    print()
    
    # 6. Agent aktualisieren
    print("🔧 Aktualisiere Agent...")
    updated_agent = client.agents.update_agent(
        agent_id=AGENT_ID,
        tools=new_tools
    )
    
    print()
    print("=" * 70)
    print("🎉 ERFOLGREICH!")
    print("=" * 70)
    print(f"Agent: {updated_agent.name} ({updated_agent.id})")
    print(f"Model: {updated_agent.model}")
    print(f"Tools gesamt: {len(updated_agent.tools)}")
    print()
    print("Alle Functions:")
    for tool in updated_agent.tools:
        if hasattr(tool, 'function') and hasattr(tool.function, 'name'):
            print(f"  ✅ {tool.function.name}")
            if hasattr(tool.function, 'description'):
                desc = tool.function.description
                print(f"     {desc[:80] if desc else 'No description'}...")
        elif hasattr(tool, 'type'):
            print(f"  📦 {tool.type}")
    print()
    print("=" * 70)
    print("🎤 Teste es jetzt in deiner Voice App!")
    print()
    print("Beispiele:")
    print("  • 'Ich möchte 100 Euro an Maria Müller überweisen'")
    print("  • 'Überweise 50 Euro an Max mit IBAN DE1234...'")
    print()
    print("Der Agent wird die Überweisungsmaske im UI anzeigen!")
    print("=" * 70)
    
except Exception as e:
    print()
    print("=" * 70)
    print(f"❌ Fehler: {e}")
    print("=" * 70)
    print()
    import traceback
    traceback.print_exc()
    print()
    print("Mögliche Lösungen:")
    print("1. Führe 'az login' aus und melde dich an:")
    print("   az login")
    print()
    print("2. Überprüfe ob der Endpoint korrekt ist:")
    print(f"   {PROJECT_ENDPOINT}")
    print()
    print("3. Stelle sicher, dass du Zugriff auf das Projekt hast:")
    print("   https://ai.azure.com → Projekt anton_233444")
    print()
    print("4. Überprüfe ob der Agent existiert:")
    print(f"   Agent ID: {AGENT_ID}")
    sys.exit(1)


