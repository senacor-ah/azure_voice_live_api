# Azure Voice Live - Authenticated Voice AI System

> Real-time voice AI with Azure Voice Live API, avatar video streaming, and on-premise authentication integration.

## 🚨 Important: Operating Mode Status

**⚠️ Currently, only `USE_AZURE_AI_AGENTS=false` (Standard Mode) is fully supported.**

When `USE_AZURE_AI_AGENTS=true` (Agent Mode), the forwarding of UI control commands (function calls) does not work properly. The Azure AI Foundry Agent mode is experimental and should only be used for testing purposes.

**Recommended Configuration:**
```env
USE_AZURE_AI_AGENTS=false
```

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Operating Modes](#operating-modes)
- [Authentication Flow](#authentication-flow)
- [Function Calling](#function-calling)
- [Development](#development)

---

## 🏗️ Architecture Overview

**Three-layer proxy architecture:**
- **Frontend** (React/TypeScript with shadcn/ui) → WebSocket client with audio capture
- **Backend** (Flask/Python) → WebSocket proxy managing authentication and Azure connections
- **Azure Voice Live** → Real-time voice AI with optional avatar video via WebRTC

**Critical security pattern:** Bearer tokens from on-prem authentication are NEVER sent to the client - they remain in the backend for API calls.

### Architecture Diagram

```
┌─────────────────┐
│  Browser Client │
└────────┬────────┘
         │ WebSocket + oneTimeToken
         ▼
┌─────────────────────────────────────────────────────────┐
│  Flask Backend (WebSocket Proxy)                        │
│  - Token Exchange (oneTimeToken → Bearer Token)         │
│  - Session Management                                   │
│  - Bearer Token stays in backend (NEVER sent to client!)│
└────────┬────────────────────────────────────────────────┘
         │ Authenticated Connection
         ▼
┌─────────────────────────────────────────────────────────┐
│  Azure Voice Live API                                   │
│  - Real-time voice streaming                            │
│  - Optional avatar video (WebRTC)                       │
│  - Function calling for UI interactions                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

**Start the entire stack:**
```bash
./start.sh  # Auto-kills port conflicts (5001 backend, 3000 frontend)
```

This script automatically:
- Kills processes on ports 5001 and 3000
- Starts backend server
- Starts frontend dev server
- Opens browser at http://localhost:3000

---

## 🔧 Backend Setup

### Prerequisites

- Python 3.9+
- Azure Voice Live API access
- On-premise authentication system (or use development mock)

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Environment Configuration

Create `backend/.env` file (use `backend/.env.example` as template):

```env
# ============================================================================
# Azure Voice Live Configuration
# ============================================================================
# IMPORTANT: Only provide the base URL, SDK automatically adds the rest
AZURE_VOICE_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/

# ============================================================================
# Operating Mode Configuration
# ============================================================================
# ⚠️ IMPORTANT: Only false is fully supported!
# When true, UI control commands (function calls) are not forwarded properly
USE_AZURE_AI_AGENTS=false

# Only needed if USE_AZURE_AI_AGENTS=true (experimental)
AZURE_AGENT_ID=asst_your-agent-id-here
AZURE_AI_PROJECT_NAME=your-project-name

# ============================================================================
# Voice & Avatar Configuration
# ============================================================================
# Voice Settings
# German voices: de-DE-FlorianMultilingualNeural, de-DE-SeraphinaMultilingualNeural
# English voices: en-US-Ava:DragonHDLatestNeural, en-US-Andrew:DragonHDLatestNeural
AZURE_VOICE_NAME=de-DE-SeraphinaMultilingualNeural

# Avatar Settings
# Available characters: lisa, james, anna
# Available styles: casual-sitting, formal-standing, professional-sitting
AZURE_AVATAR_CHARACTER=lisa
AZURE_AVATAR_STYLE=casual-sitting
AZURE_AVATAR_ENABLED=true

# Avatar Video Quality
# Resolution: 1280x720 (HD), 1920x1080 (Full HD), 640x480 (SD)
AZURE_AVATAR_VIDEO_WIDTH=1280
AZURE_AVATAR_VIDEO_HEIGHT=720
# Bitrate: 1000000 (1 Mbps), 2000000 (2 Mbps recommended), 3000000 (3 Mbps)
AZURE_AVATAR_VIDEO_BITRATE=2000000

# ============================================================================
# Recording Configuration
# ============================================================================
ENABLE_RECORDING=true
RECORDINGS_DIR=recordings

# ============================================================================
# On-Prem Integration (Authentication & API)
# ============================================================================
# For production: Use your on-premise system endpoints
ONPREM_AUTH_URL=https://your-onprem-system.com/api/auth/exchange-token
ONPREM_API_BASE_URL=https://your-onprem-system.com/api

# For development: Use local mock
# ONPREM_AUTH_URL=http://localhost:5001/mock-auth/exchange-token
# ONPREM_API_BASE_URL=http://localhost:5001/mock-api

# ============================================================================
# Server Configuration
# ============================================================================
HOST=0.0.0.0
PORT=5001
FLASK_ENV=development
```

### Key Backend Files

- **[app.py](backend/src/app.py)** - Main Flask application with `/ws/voice` endpoint
- **[voice_proxy_handler.py](backend/src/voice_proxy_handler.py)** - Core proxy logic, Azure connection, WebSocket handling (1335 lines)
- **[auth_session_manager.py](backend/src/auth_session_manager.py)** - Token exchange and session management

### Running the Backend

```bash
cd backend
python3 src/app.py
```

Expected output:
```
Backend running on http://0.0.0.0:5001
WebSocket endpoint: ws://0.0.0.0:5001/ws/voice
```

---

## 💻 Frontend Setup

### Two Frontend Options

1. **frontend_new/** - Active React/TypeScript frontend (Vite + shadcn/ui) ⭐ Recommended
2. **frontend/** - Legacy React frontend (still functional)

### Installation (frontend_new)

```bash
cd frontend_new
npm install
```

### Environment Configuration

The frontend uses Vite environment variables:

- `VITE_BACKEND_URL` - Backend WebSocket URL (default: `ws://localhost:5001`)
- `VITE_ENV` - Environment (development/production)
- `VITE_DEV_ONE_TIME_TOKEN` - Development mock token (auto-generated)

### Running the Frontend

```bash
cd frontend_new
npm run dev
```

App runs on: http://localhost:3000

### Key Frontend Files

- **[VoiceSessionPage.jsx](frontend/src/components/VoiceSessionPage.jsx)** - Main UI with connection, transcript, avatar video
- **[TransferConfirmation.jsx](frontend/src/components/TransferConfirmation.jsx)** - Function call confirmation modal
- **[voice-client.ts](frontend_new/src/lib/voice-client.ts)** - WebSocket client and audio handling

---

## 🔀 Operating Modes

The system supports two operating modes controlled by `USE_AZURE_AI_AGENTS` in `backend/.env`:

### Standard Mode (✅ Fully Supported)
```env
USE_AZURE_AI_AGENTS=false
```

**Features:**
- ✅ Tools and system prompts defined in Python code ([voice_proxy_handler.py](backend/src/voice_proxy_handler.py#L715))
- ✅ Full function calling support with UI interactions
- ✅ Immediate code control and updates
- ✅ Lower latency
- ✅ Banking demo with transfer confirmations
- ✅ All UI control commands work properly

**Use this mode for production and regular development.**

### Agent Mode (⚠️ Experimental - Not Fully Supported)
```env
USE_AZURE_AI_AGENTS=true
AZURE_AGENT_ID=asst_your-agent-id-here
AZURE_AI_PROJECT_NAME=your-project-name
```

**Features:**
- ❌ UI control commands (function calls) are NOT forwarded properly
- ⚠️ Tools and prompts managed in Azure AI Foundry portal
- ⚠️ Can update agent tools via scripts: `python3 scripts_and_dev_tools/add_transfer_function_banking.py`
- ⚠️ Higher latency due to agent routing
- ⚠️ Only for testing Azure AI Foundry integration

**Known Issues:**
- Function call events from Azure AI Foundry Agent are not properly forwarded to the frontend
- UI confirmation modals do not appear
- User interactions with function calls are broken

**Do not use this mode for production or demos until the forwarding issue is resolved.**

---

## 🔐 Authentication Flow

The system implements a secure three-step authentication process:

1. **Client obtains `oneTimeToken`** from on-premise system
2. **Client connects via WebSocket**: `{"type":"auth.init","oneTimeToken":"xxx"}`
3. **Backend exchanges token** with on-prem auth system for Bearer token
4. **Backend creates session** with bearer token (never leaves backend!)
5. **Backend establishes Azure connection** with user context
6. **Bidirectional streaming begins**

### Authentication Diagram

```
┌─────────────────┐
│  Browser Client │
└────────┬────────┘
         │ (1) {"type":"auth.init","oneTimeToken":"xxx"}
         ▼
┌─────────────────────────────────────────────────────────┐
│  Flask Backend                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ AuthSessionManager.create_session_from_one_time_  │ │
│  │ token()                                            │ │
│  └──────────────────┬──────────────────────────────────┘ │
└───────────────────┬─┴──────────────────────────────────┘
                    │ (2) POST /api/auth/exchange-token
                    ▼
┌─────────────────────────────────────────────────────────┐
│  On-Prem Auth System                                    │
│  Response: {                                             │
│    "access_token": "Bearer eyJhbGc...",                  │
│    "user_id": "user123",                                 │
│    "name": "Max Mustermann",                             │
│    "email": "max@example.com"                            │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │ (3) Bearer token stored in backend
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Backend - SessionInfo                                  │
│  ✅ session_id: "session-abc123"                         │
│  ✅ bearer_token: "eyJhbGc..." (STAYS IN BACKEND!)       │
│  ✅ user_context: {user_id, name, email}                 │
│  ❌ Bearer token NEVER sent to client!                   │
└──────────────────┬──────────────────────────────────────┘
                   │ (4) Connect to Azure with user context
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Azure Voice Live API                                   │
│  - Personalized session with user context               │
│  - Voice streaming with avatar                          │
└─────────────────────────────────────────────────────────┘
```

**Security Note:** The bearer token NEVER leaves the backend server. All on-premise API calls are made by the backend on behalf of the user.

---

## 🎯 Function Calling

Function calling enables interactive UI elements triggered by voice commands. This feature **only works in Standard Mode** (`USE_AZURE_AI_AGENTS=false`).

### Example: Banking Transfer Confirmation

**User says:** "Ich möchte 100 Euro an Maria überweisen"

**Flow:**
1. AI asks for missing information (recipient, amount)
2. AI generates IBAN and calls function: `ueberweisung_bestaetigen`
3. Backend receives function call event
4. Frontend displays confirmation modal
5. User confirms or rejects
6. Result sent back to AI
7. AI provides feedback

### Adding a New Function (Standard Mode)

1. Define `FunctionTool` in [voice_proxy_handler.py](backend/src/voice_proxy_handler.py#L715-L735)
2. Handle function call results in `_handle_function_call_result()`
3. Update frontend to display/handle the function call event

---

## 🛠️ Development

### Project Structure

```
azure_voicelive/
├── backend/
│   ├── src/
│   │   ├── app.py                      # Flask app + WebSocket endpoint
│   │   ├── voice_proxy_handler.py      # Core proxy logic (1335 lines)
│   │   ├── auth_session_manager.py     # Token exchange + sessions
│   │   └── appointment_workflow.py     # Appointment booking logic
│   ├── recordings/                     # Auto-saved conversations
│   ├── .env.example                    # Environment template
│   └── requirements.txt
├── frontend_new/                       # Active frontend (Vite + TypeScript)
│   └── src/
│       ├── components/voice-session/   # Voice UI components
│       ├── lib/voice-client.ts         # WebSocket client
│       └── pages/                      # App pages
├── frontend/                           # Legacy frontend (still functional)
├── scripts_and_dev_tools/              # Azure AI Foundry scripts
│   ├── add_transfer_function_banking.py
│   └── update_agent_instructions.py
└── start.sh                            # Start entire stack
```

### Audio Handling

- **Format:** PCM16, 24kHz mono input, stereo output
- **Client:** Captures via AudioWorklet → sends to backend as JSON arrays
- **Backend:** Converts to bytes, forwards to Azure
- **Azure:** Responses streamed back and decoded in client

### Avatar Video (WebRTC)

- Configured via `AZURE_AVATAR_CHARACTER`, `AZURE_AVATAR_STYLE` in `.env`
- Resolution/bitrate: `AZURE_AVATAR_VIDEO_WIDTH/HEIGHT/BITRATE`
- WebRTC negotiation handled in [voice_proxy_handler.py](backend/src/voice_proxy_handler.py#L850-L920)
- Video element bound in React component: `client.setVideoElement(videoRef.current)`

### Recording

- Conversations auto-saved to `backend/recordings/` as stereo WAV files
- Includes metadata JSON with events, timestamps, function calls
- Controlled by `ENABLE_RECORDING=true` in `.env`

### Debugging

**Backend logs:**
- All message types and flow details logged
- Enable DEBUG level: `logging.getLogger('voice_proxy_handler').setLevel(logging.DEBUG)` in [app.py](backend/src/app.py#L36)

**Frontend console:**
- Connection states and event handlers
- WebSocket message flow
- Function call events

---

## 📦 Dependencies

### Backend
- `azure-ai-voicelive>=1.0.0` - Azure Voice Live SDK
- `flask` - Web server
- `flask-sock` - WebSocket support
- `httpx` - HTTP client for on-prem API calls
- `azure-identity` - Azure authentication

### Frontend
- React 18 - UI framework
- Vite 5 - Build tool
- shadcn/ui - UI components (Radix UI primitives)
- TanStack Query - Data fetching
- react-router-dom - Routing

---

## 🔒 Security Considerations

**⚠️ This is a demo implementation!**

For production use:
- ✅ Use real on-premise authentication system
- ✅ Implement proper IBAN validation
- ✅ Add recipient verification
- ✅ Enable HTTPS/WSS encryption
- ✅ Implement rate limiting
- ✅ Add proper error handling
- ✅ Use environment-specific configurations
- ✅ Never expose API keys in client code

---

## 📝 License

This project is for demonstration purposes. Adjust according to your needs.

---

## 🆘 Support

For issues or questions:
1. Check logs in `backend/src/app.py` (enable DEBUG level)
2. Review recordings in `backend/recordings/` for conversation flow
3. Ensure `.env` configuration is correct
4. Verify Azure credentials and endpoints

---

**Built with ❤️ using Azure Voice Live API**
