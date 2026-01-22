#!/usr/bin/env python3
"""
Fügt die Überweisungsbestätigungs-Function zum Azure AI Foundry Agent hinzu.
Aktualisiert auch die Instructions für den Commerzbank-Bankberater.
"""

import os
import sys
import json
from pathlib import Path

# Load .env from backend folder
env_file = Path(__file__).parent.parent / "backend" / ".env"
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

# Configuration aus .env
AGENT_ID = os.getenv("AZURE_AGENT_ID", "")
PROJECT_NAME = os.getenv("AZURE_AI_PROJECT_NAME", "")

# Extract resource name from endpoint if available
AZURE_ENDPOINT = os.getenv("AZURE_VOICE_ENDPOINT", "")
if AZURE_ENDPOINT and ".cognitiveservices.azure.com" in AZURE_ENDPOINT:
    RESOURCE_NAME = AZURE_ENDPOINT.split("//")[1].split(".")[0]
else:
    print("❌ Konnte RESOURCE_NAME nicht aus AZURE_VOICE_ENDPOINT extrahieren")
    print("   Bitte setze RESOURCE_NAME manuell im Script")
    sys.exit(1)

if not AGENT_ID or not PROJECT_NAME:
    print("❌ Fehler: AZURE_AGENT_ID oder AZURE_AI_PROJECT_NAME nicht gesetzt!")
    print("\nBitte setze in backend/.env:")
    print("  AZURE_AGENT_ID=asst_xxxxx")
    print("  AZURE_AI_PROJECT_NAME=your-project-name")
    sys.exit(1)

# Azure AI Foundry Project Endpoint
PROJECT_ENDPOINT = f"https://{RESOURCE_NAME}.services.ai.azure.com/api/projects/{PROJECT_NAME}"

print("=" * 70)
print("🏦 Commerzbank Bankberater Agent Setup")
print("=" * 70)
print(f"Agent ID:         {AGENT_ID}")
print(f"Project:          {PROJECT_NAME}")
print(f"Resource:         {RESOURCE_NAME}")
print(f"Project Endpoint: {PROJECT_ENDPOINT}")
print("=" * 70)
print()

# Commerzbank Bankberater Instructions
BANKING_INSTRUCTIONS = """Du bist ein freundlicher und kompetenter Commerzbank Bankberater, der Kunden bei Bankgeschäften unterstützt.

DEINE ROLLE:
- Du hilfst bei Überweisungen und anderen Bankgeschäften
- Du bist höflich, professionell und kundenorientiert
- Du sprichst natürlich und auf Deutsch

WORKFLOW FÜR ÜBERWEISUNGEN:
1. Begrüße den Kunden freundlich
2. Frage nach dem EMPFÄNGERNAMEN
3. Frage nach dem ÜBERWEISUNGSBETRAG in Euro
4. Optional: Frage nach dem Verwendungszweck
5. Wenn du den Namen und Betrag hast, GENERIERE SELBST eine realistische deutsche IBAN
   (Format: DE + 20 Ziffern, z.B. DE89370400440532013000)
6. Verwende dann das Tool "ueberweisung_bestaetigen" mit den Daten
7. Der Kunde kann dann die Überweisung im UI bestätigen oder ablehnen

WICHTIGE REGELN:
- Halte Antworten KURZ (2-3 Sätze)
- Verwende natürliche, gesprochene Sprache
- Spreche den Kunden gelegentlich mit Namen an
- FRAGE NICHT nach der IBAN - denke sie dir aus!
- Die IBAN muss das Format DE + 20 Ziffern haben
- Rufe das Tool auf, sobald du Name und Betrag hast
"""

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
    
    # 4. Erstelle Function Definition für Überweisungsbestätigung
    print("🔨 Erstelle Function Definition...")
    
    function_def = FunctionDefinition(
        name="ueberweisung_bestaetigen",
        description="Zeigt eine Überweisungsbestätigung im UI an, damit der Benutzer die Überweisung bestätigen kann. Verwende dieses Tool NUR, wenn der Benutzer ALLE erforderlichen Informationen (Name und Betrag) bereitgestellt hat. Du generierst selbst eine IBAN.",
        parameters={
            "type": "object",
            "properties": {
                "recipient": {
                    "type": "string",
                    "description": "Name des Empfängers der Überweisung"
                },
                "iban": {
                    "type": "string",
                    "description": "IBAN des Empfängers im Format DEXX XXXX XXXX XXXX XXXX XX (z.B. DE89370400440532013000). Du generierst diese selbst."
                },
                "amount": {
                    "type": "number",
                    "description": "Betrag in Euro (z.B. 100.50)"
                },
                "currency": {
                    "type": "string",
                    "description": "Währung der Überweisung",
                    "default": "EUR"
                },
                "purpose": {
                    "type": "string",
                    "description": "Verwendungszweck der Überweisung (optional)"
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
    
    # 6. Agent aktualisieren mit neuen Instructions und Tools
    print("🔧 Aktualisiere Agent mit Bankberater-Instructions und Tools...")
    updated_agent = client.agents.update_agent(
        agent_id=AGENT_ID,
        instructions=BANKING_INSTRUCTIONS,
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
    print("Instructions Preview:")
    print("-" * 70)
    print(updated_agent.instructions[:300] + "...")
    print("-" * 70)
    print()
    print("=" * 70)
    print("🎤 Teste es jetzt in deiner Voice App!")
    print()
    print("1. Setze in backend/.env:")
    print("   USE_AZURE_AI_AGENTS=true")
    print()
    print("2. Starte Backend und Frontend neu")
    print()
    print("3. Teste:")
    print("   User: 'Ich möchte 100 Euro an Maria überweisen'")
    print("   Agent: Fragt nur nach Empfänger und Betrag")
    print("   Agent: Generiert selbst IBAN und zeigt Bestätigungsmaske!")
    print()
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
    print("   https://ai.azure.com")
    print()
    print("4. Überprüfe ob AZURE_AGENT_ID und AZURE_AI_PROJECT_NAME in .env gesetzt sind")
    sys.exit(1)

