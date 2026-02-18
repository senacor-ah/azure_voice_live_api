# Web PubSub Event Monitor

Real-time monitoring of streamed conversation events via Azure Web PubSub.

## Files

| File | Description |
|------|-------------|
| `event_monitor.html` | Browser-based dashboard – displays live events as they arrive |
| `get_webpubsub_url.py` | Generates a fresh, signed WebSocket access URL (valid for 1 hour) |

---

## How to Monitor Events in Real Time

### 1. Start the application

From the project root, run:

```bash
./start.sh
```

This starts:
- **Backend** (Flask) on `http://localhost:5001`
- **Frontend** (Vite) on `http://localhost:3000`

Make sure your `.env` file (inside `backend/`) contains:

```env
AZURE_WEBPUBSUB_CONNECTION_STRING=<your-connection-string>
AZURE_WEBPUBSUB_HUB_NAME=conversation_events   # default
```

---

### 2. Generate a fresh WebSocket URL

The access token embedded in `event_monitor.html` expires after **1 hour**.  
Whenever it has expired, generate a new one:

```bash
# From the project root (with the virtual environment active)
source .venv/bin/activate
python backend/webpubsub/get_webpubsub_url.py
```

The script prints a line like:

```
const ACCESS_URL = 'wss://...webpubsub.azure.com/client/hubs/conversation_events?access_token=...';
```

Copy that line and replace the existing `ACCESS_URL` value on **line 271** of `event_monitor.html`.

---

### 3. Open the monitor in your browser

Open `backend/webpubsub/event_monitor.html` directly in any browser (no server needed):

```bash
open backend/webpubsub/event_monitor.html   # macOS
```

Click **Connect** in the UI to establish the WebSocket connection.

---

### 4. Inspect events in the browser console

Open the **DevTools console** (`F12` → _Console_ tab).  
Every incoming event is logged in structured JSON so you can see:

- the **event type** (e.g. `session_start`, `session_end`, `user_turn`, `agent_turn`, …)
- the full **payload** including metadata, timing, and content

Events also appear as formatted cards in the page UI for a human-friendly overview.

---

## Event Types

All events share the same envelope structure:

```json
{
  "type": "<event_type>",
  "timestamp": "2026-02-18T10:00:00.000Z",
  "data": { ... }
}
```

The table below lists every event published by `backend/src/event_streaming.py`, with all fields that appear inside `data`.

| # | Event Type | Data Fields |
|---|------------|-------------|
| 1 | `session.started` | `session_id`, `user_name`, `user_id` |
| 2 | `session.ended` | `session_id`, `user_name`, `user_id`, `duration_seconds` _(optional)_ |
| 3 | `session.updated` | `session_id`, `user_id`, `config` _(optional)_ |
| 4 | `input_audio_buffer.speech_started` | `session_id`, `user_id` |
| 5 | `input_audio_buffer.speech_stopped` | `session_id`, `user_id` |
| 6 | `conversation.item.input_audio_transcription.completed` | `session_id`, `transcript`, `user_id` |
| 7 | `response.audio_transcript.done` | `session_id`, `transcript`, `user_id` |
| 8 | `response.created` | `session_id`, `user_id`, `response_id` _(optional)_ |
| 9 | `response.done` | `session_id`, `user_id`, `response_id` _(optional)_, `status` _(optional)_ |
| 10 | `authentication_succeeded` | `session_id`, `user_name`, `user_id`, `successful` |
| 11 | `agent_invoked` | `session_id`, `user_id`, `agent_config` _(optional)_ |
| 12 | `function_called` | `session_id`, `user_id`, `function_name`, `call_id` _(optional)_, `function_arguments` _(optional)_, `function_output` _(optional)_ |
| 13 | `transfer_confirmed` | `session_id`, `user_id`, `confirmed`, `transfer_details` |
| 14 | `rag_embedding_completed` | `session_id`, `user_id`, `question`, `embedding_time_ms` |
| 15 | `rag_vector_search_completed` | `session_id`, `user_id`, `search_time_ms`, `top_chunks` _(array, max 5)_ |
| 16 | `rag_llm_generation_completed` | `session_id`, `user_id`, `first_token_time_ms`, `total_completion_time_ms`, `answer_length` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "WebSocket connection failed" | Token is expired – re-run `get_webpubsub_url.py` and update `event_monitor.html` |
| No events appearing | Verify `AZURE_WEBPUBSUB_CONNECTION_STRING` is set and the backend is running |
| `❌ Error: AZURE_WEBPUBSUB_CONNECTION_STRING not found` | Add the variable to `backend/.env` |



