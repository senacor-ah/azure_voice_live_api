#!/usr/bin/env python3
"""
Generate a fresh WebSocket URL for the event_monitor.html page.
This script creates a client access URL with a valid token.
"""

import os
from datetime import timedelta
from azure.messaging.webpubsubservice import WebPubSubServiceClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_subscriber_url():
    """Generate a WebSocket URL for subscribing to events."""
    
    connection_string = os.getenv("AZURE_WEBPUBSUB_CONNECTION_STRING")
    hub_name = os.getenv("AZURE_WEBPUBSUB_HUB_NAME", "conversation_events")
    
    if not connection_string:
        print("❌ Error: AZURE_WEBPUBSUB_CONNECTION_STRING not found in environment variables")
        print("Please set it in your .env file or export it:")
        print("export AZURE_WEBPUBSUB_CONNECTION_STRING='your-connection-string'")
        return
    
    try:
        # Create Web PubSub service client
        client = WebPubSubServiceClient.from_connection_string(
            connection_string=connection_string,
            hub=hub_name
        )
        
        # Generate client access URL with 1 hour expiration
        token = client.get_client_access_token(
            roles=["webpubsub.sendToGroup", "webpubsub.joinLeaveGroup"],
            minutes_to_expire=60
        )
        
        print("=" * 80)
        print("✅ WebSocket URL generated successfully!")
        print("=" * 80)
        print("\nCopy this URL and paste it into backend/webpubsub/event_monitor.html (line 271):")
        print("\nconst ACCESS_URL = '" + token['url'] + "';")
        print("\n" + "=" * 80)
        print(f"Hub: {hub_name}")
        print("Token expires in: 1 hour")
        print("=" * 80)
        
        return token['url']
        
    except Exception as e:
        print(f"❌ Error generating URL: {e}")
        return None

if __name__ == "__main__":
    get_subscriber_url()
