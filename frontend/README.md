# 🎙️ Azure Voice Live - React Frontend

Modernes React Frontend mit **shadcn/ui** und **Voice Client** für Azure Voice Live API mit Bearer Token Authentication.

## 📋 Features

- ✅ **oneTimeToken Authentication** - Sicherer Token-Exchange Flow
- ✅ **Real-time Voice Streaming** - Bidirektionale Audio-Kommunikation
- ✅ **Live Transcript** - Echtzeit-Konversationsmitschrift
- ✅ **Audio Visualizer** - Visuelle Audio-Aktivitätsanzeige
- ✅ **Session Management** - User-Context und Session-Stats
- ✅ **On-Prem API Integration** - Backend-Calls mit Bearer Token
- ✅ **shadcn/ui Components** - Moderne, accessible UI-Komponenten
- ✅ **Responsive Design** - Mobile-friendly Layout

## 🚀 Quick Start

### 1. Dependencies installieren

```bash
cd frontend
npm install
```

### 2. shadcn/ui Komponenten installieren

**Option A: Mit Script (empfohlen)**

```bash
chmod +x setup-shadcn.sh
./setup-shadcn.sh
```

**Option B: Manuell**

```bash
npx shadcn@latest add button card badge scroll-area alert separator
```

### 3. Development Server starten

```bash
npm run dev
```

Frontend läuft auf: **http://localhost:3000**

### 4. Backend starten (in separatem Terminal)

```bash
cd ../backend
python src/app.py
```

Backend läuft auf: **http://localhost:5000**

## 📁 Projekt-Struktur

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn Komponenten (CLI-generiert)
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── scroll-area.jsx
│   │   │   └── separator.jsx
│   │   └── VoiceSessionPage.jsx   # Main Voice UI Component
│   ├── lib/
│   │   ├── utils.js               # Tailwind cn() helper
│   │   └── voice-client.js        # AuthenticatedVoiceClient
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                  # Tailwind + shadcn styles
├── components.json                # shadcn/ui config
├── tailwind.config.js
├── vite.config.js
├── package.json
└── index.html
```

## 🔧 Konfiguration

### Backend URL ändern

In `src/lib/voice-client.js`:

```javascript
// Development
const client = new AuthenticatedVoiceClient('ws://localhost:5000');

// Production  
const client = new AuthenticatedVoiceClient('wss://your-production-domain.com');
```

### oneTimeToken Integration

In `src/components/VoiceSessionPage.jsx` die Funktion `fetchOneTimeToken` anpassen:

```javascript
const fetchOneTimeToken = async () => {
  // Dein On-Prem System Token-Endpoint
  const response = await fetch('https://your-system.com/api/auth/generate-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Sendet Cookies mit
  });
  
  const data = await response.json();
  return data.oneTimeToken;
};
```

## 🎨 shadcn/ui Komponenten

Installierte Komponenten:

- **Button** - Action Buttons (Connect, Disconnect, Mute)
- **Card** - Content Container für Session Info, Transcript, etc.
- **Badge** - Status Badges (Connected, Disconnected, etc.)
- **Alert** - Error Messages
- **ScrollArea** - Scrollbarer Transcript-Bereich
- **Separator** - Visuelle Trenner

### Weitere Komponenten hinzufügen

```bash
# Liste aller verfügbaren Komponenten
npx shadcn@latest add

# Beispiel: Dialog hinzufügen
npx shadcn@latest add dialog
```

## 🔌 WebSocket Proxy

Vite Dev Server proxied WebSocket-Anfragen automatisch zum Backend:

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/ws': {
      target: 'ws://localhost:5000',
      ws: true,
    },
  },
}
```

## 📝 Nutzung

### 1. Session starten

```javascript
import { AuthenticatedVoiceClient } from '@/lib/voice-client';

const client = new AuthenticatedVoiceClient('ws://localhost:5000');

// oneTimeToken von deinem System holen
const token = await fetchOneTimeToken();

// Verbinden
const session = await client.connect(token);
// { sessionId: "session-abc...", userName: "Max Mustermann" }
```

### 2. Event Handlers registrieren

```javascript
// Text-Responses vom AI
client.onTextReceived((text) => {
  console.log('AI sagt:', text);
});

// On-Prem API Responses
client.onApiResponse((endpoint, data) => {
  console.log('API Response:', endpoint, data);
});
```

### 3. On-Prem APIs aufrufen

```javascript
// Backend nutzt automatisch den Bearer Token aus der Session
client.callOnPremApi('/api/customer/profile', 'GET');

// Mit Payload
client.callOnPremApi('/api/orders', 'POST', {
  product: 'ABC123',
  quantity: 5
});
```

### 4. Text senden

```javascript
client.sendText('Hallo, wie kann ich dir helfen?');
```

### 5. Disconnect

```javascript
client.disconnect();
```

## 🎭 Voice Session Page

Die `VoiceSessionPage` Component bietet eine vollständige UI:

```jsx
import VoiceSessionPage from '@/components/VoiceSessionPage';

function App() {
  return <VoiceSessionPage />;
}
```

**Features:**
- Session Status Badge
- Connect/Disconnect Buttons
- Mute/Unmute Toggle
- Live Transcript mit Timestamps
- Audio Visualizer
- Session Statistics
- Error Handling

## 🛠️ Development

### Build für Production

```bash
npm run build
```

Output: `dist/` Ordner

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## 🐛 Troubleshooting

### shadcn Komponenten nicht gefunden

```bash
# Prüfe components.json
cat components.json

# Re-install Komponenten
npx shadcn@latest add button card badge
```

### WebSocket Connection Failed

1. **Backend läuft?** Check `http://localhost:5000/api/health`
2. **Proxy korrekt?** Check `vite.config.js`
3. **CORS Issues?** Check Backend CORS-Config
4. **Browser Console** für detaillierte Fehler

### Path Alias `@` funktioniert nicht

Prüfe `vite.config.js`:

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tailwind Styles laden nicht

1. Check `tailwind.config.js` content paths
2. Stelle sicher `index.css` wird importiert in `main.jsx`
3. Dev Server neu starten

## 📚 Dokumentation

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)

## 🔗 Verwandte Dateien

- Backend: `../backend/`
- Architecture: `../ARCHITECTURE.md`
- Voice Client: `../frontend/voice-client.js` (vanilla JS version)

## 📄 Lizenz

MIT

