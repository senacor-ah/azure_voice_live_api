#!/usr/bin/env python3
"""
Prüft ob Agent941 ein OpenAI Assistant ist und über welchen Endpoint er erreichbar ist.
"""

import os
import sys
from pathlib import Path

# Manuell .env laden
backend_dir = Path(__file__).parent / "backend"
env_file = backend_dir / ".env"

if env_file.exists():
    print(f"📂 Lade .env Datei: {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    print("✅ .env Datei geladen")
    print()

try:
    from openai import AzureOpenAI
except ImportError:
    print("❌ OpenAI SDK nicht installiert!")
    print("Führe aus: pip install openai")
    sys.exit(1)

AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"

# Verschiedene Endpoint-Varianten testen
ENDPOINT_VARIANTS = [
    f"https://{RESOURCE_NAME}.openai.azure.com",
    f"https://{RESOURCE_NAME}.cognitiveservices.azure.com",
    os.getenv("AZURE_OPENAI_ENDPOINT", ""),
    os.getenv("AZURE_VOICE_ENDPOINT", ""),
]

# API Versions für Assistants
API_VERSIONS = [
    "2024-12-01-preview",
    "2024-05-01-preview", 
    "2024-02-15-preview",
]

AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")

if not AZURE_API_KEY:
    print("❌ AZURE_OPENAI_API_KEY nicht gesetzt!")
    sys.exit(1)

print("=" * 70)
print("🔍 Überprüfe Agent941 über verschiedene Endpoints")
print("=" * 70)
print(f"Agent ID: {AGENT_ID}")
print(f"API Key: {AZURE_API_KEY[:10]}...")
print()

for endpoint in ENDPOINT_VARIANTS:
    if not endpoint:
        continue
        
    print(f"\n📡 Teste Endpoint: {endpoint}")
    print("-" * 70)
    
    for api_version in API_VERSIONS:
        try:
            print(f"   API Version: {api_version}...", end=" ")
            
            client = AzureOpenAI(
                api_key=AZURE_API_KEY,
                api_version=api_version,
                azure_endpoint=endpoint
            )
            
            # Versuche Agent abzurufen
            agent = client.beta.assistants.retrieve(assistant_id=AGENT_ID)
            
            print("✅ ERFOLGREICH!")
            print()
            print("=" * 70)
            print("🎉 AGENT GEFUNDEN!")
            print("=" * 70)
            print(f"Endpoint:     {endpoint}")
            print(f"API Version:  {api_version}")
            print(f"Agent ID:     {agent.id}")
            print(f"Name:         {agent.name}")
            print(f"Model:        {agent.model}")
            print(f"Created:      {agent.created_at}")
            print()
            print("Instructions (first 200 chars):")
            print(f"  {agent.instructions[:200] if agent.instructions else 'None'}...")
            print()
            print(f"Tools ({len(agent.tools)}):")
            for tool in agent.tools:
                if hasattr(tool, 'function'):
                    print(f"  🔧 Function: {tool.function.name}")
                    print(f"     → {tool.function.description[:80] if tool.function.description else 'No description'}...")
                elif hasattr(tool, 'type'):
                    print(f"  📦 {tool.type}")
            print()
            print("=" * 70)
            print("✅ Dies ist ein OpenAI Assistant!")
            print(f"   Nutze: AZURE_OPENAI_ENDPOINT={endpoint}")
            print(f"   API Version: {api_version}")
            print("=" * 70)
            sys.exit(0)
            
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg or "NotFound" in error_msg:
                print("❌ Agent nicht gefunden")
            elif "401" in error_msg or "Unauthorized" in error_msg:
                print("❌ Authentifizierung fehlgeschlagen")
            elif "ResourceNotFound" in error_msg:
                print("❌ Resource existiert nicht")
            else:
                print(f"❌ Fehler: {error_msg[:80]}...")

print()
print("=" * 70)
print("❌ Agent konnte über KEINEN Endpoint gefunden werden!")
print("=" * 70)
print()
print("Mögliche Ursachen:")
print("1. Agent-ID ist falsch")
print("2. Agent existiert nicht in diesem Azure Tenant")
print("3. Agent wurde gelöscht")
print("4. Endpoint/Resource-Name ist falsch")
print()
print("Tipp: Überprüfe in Azure AI Foundry:")
print("  → https://ai.azure.com")
print("  → Projekt 'anton_233444'")
print("  → Agents → Agent941")
print("  → Kopiere die korrekte Agent-ID")

