#!/usr/bin/env python3
"""
Interaktives Script zum Überprüfen des Agent941.
Fragt nach API Key und Endpoint.
"""

import sys

try:
    from openai import AzureOpenAI
except ImportError:
    print("❌ OpenAI SDK nicht installiert!")
    print("Führe aus: pip install openai")
    sys.exit(1)

AGENT_ID = "asst_DE5fwnx9zNwMZ1ADT9x7WkpG"
RESOURCE_NAME = "anton-233444-resource"

print("=" * 70)
print("🔍 Agent941 Überprüfung")
print("=" * 70)
print()

# Frage nach API Key
print("Bitte gib deinen Azure OpenAI API Key ein:")
print("(zu finden in: Azure Portal → Azure OpenAI Resource → Keys and Endpoint)")
api_key = input("API Key: ").strip()

if not api_key:
    print("❌ API Key erforderlich!")
    sys.exit(1)

print()
print("Teste verschiedene Endpoints...")
print()

# Endpoint-Varianten
endpoints = [
    f"https://{RESOURCE_NAME}.openai.azure.com",
    f"https://{RESOURCE_NAME}.cognitiveservices.azure.com",
]

api_versions = [
    "2024-12-01-preview",
    "2024-05-01-preview",
]

for endpoint in endpoints:
    print(f"\n📡 Endpoint: {endpoint}")
    
    for api_version in api_versions:
        try:
            print(f"   Version {api_version}...", end=" ", flush=True)
            
            client = AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=endpoint
            )
            
            agent = client.beta.assistants.retrieve(assistant_id=AGENT_ID)
            
            print("✅ GEFUNDEN!")
            print()
            print("=" * 70)
            print("🎉 AGENT ERFOLGREICH ABGERUFEN!")
            print("=" * 70)
            print(f"Endpoint:     {endpoint}")
            print(f"API Version:  {api_version}")
            print(f"Agent ID:     {agent.id}")
            print(f"Name:         {agent.name}")
            print(f"Model:        {agent.model}")
            print()
            
            if agent.instructions:
                print("Instructions (first 300 chars):")
                print(f"  {agent.instructions[:300]}...")
                print()
            
            print(f"Tools/Functions ({len(agent.tools)}):")
            if agent.tools:
                for tool in agent.tools:
                    if hasattr(tool, 'function'):
                        print(f"  🔧 {tool.function.name}")
                        if tool.function.description:
                            print(f"     {tool.function.description[:100]}...")
                    else:
                        print(f"  📦 {tool.type}")
            else:
                print("  (Keine Functions definiert)")
            
            print()
            print("=" * 70)
            print("✅ Ja, dies ist ein OpenAI Assistant!")
            print()
            print("Füge zu deiner .env Datei hinzu:")
            print(f"AZURE_OPENAI_ENDPOINT={endpoint}")
            print(f"AZURE_OPENAI_API_KEY={api_key[:10]}...{api_key[-4:]}")
            print("=" * 70)
            sys.exit(0)
            
        except Exception as e:
            error_str = str(e)
            if "404" in error_str or "not found" in error_str.lower():
                print("❌ Nicht gefunden")
            elif "401" in error_str or "unauthorized" in error_str.lower():
                print("❌ Auth Fehler")
            else:
                print(f"❌ {error_str[:50]}...")

print()
print("=" * 70)
print("❌ Agent konnte nicht gefunden werden!")
print("=" * 70)
print()
print("Möglichkeiten:")
print("1. Falsche Agent-ID")
print("2. Agent ist kein OpenAI Assistant (evtl. Azure AI Services Agent)")
print("3. Endpoint/Resource falsch")
print()
print("Überprüfe in Azure AI Foundry Studio:")
print("  https://ai.azure.com → Projekt anton_233444 → Agents")

