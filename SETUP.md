# SafePath AI — Running the project in VS Code

## 1. Get the code

Pick ONE:

**A. GitHub (recommended)**
1. In Lovable, top-right → **GitHub → Connect to GitHub**, then **Create repository**.
2. In VS Code: `git clone https://github.com/<you>/<repo>.git`

**B. ZIP download**
Lovable → **⋯ (three dots) → Download / Export project** → unzip anywhere.

Either way you get every file exactly as it is here — no copy-paste needed.

## 2. Install these tools

| Tool | Why | Where |
|---|---|---|
| Node.js 20+ (LTS) | runs the app | https://nodejs.org |
| VS Code | editor | https://code.visualstudio.com |
| Git | clone/push code | https://git-scm.com |
| Bun (optional, faster) | package manager | https://bun.sh |

Verify in a terminal: `node -v` (should print v20 or higher).

### Recommended VS Code extensions
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

## 3. Install dependencies

Open the project folder in VS Code, then in the terminal (`Ctrl+~`):

```bash
npm install      # or: bun install
```

## 4. Run it

```bash
npm run dev      # or: bun run dev
```

Open http://localhost:8080 — the app hot-reloads as you edit.

Other commands:
```bash
npm run build    # production build
npm run preview  # preview the production build
```

## 5. Voice navigation notes

The voice assistant uses the browser's Web Speech APIs:
- **Works in:** Chrome / Edge (desktop + Android). Safari and Firefox have partial or no
  `SpeechRecognition` support — the app automatically falls back to a typed-command box.
- **Microphone requires a secure context:** `localhost` is fine; on a phone over your LAN IP
  it will be blocked unless you use HTTPS.
- Allow the microphone permission prompt when it appears (in Chrome: 🔒 icon in the address
  bar → Site settings → Microphone → Allow).

## 6. Project map (where each feature lives)

```
src/
  routes/                 one file per screen (TanStack Router, file-based)
    __root.tsx            app shell wrapper, <head> metadata, providers
    index.tsx             splash → onboarding → home map + VOICE NAVIGATION
    alerts.tsx            community alerts timeline
    chat.tsx              AI safety chat assistant
    analytics.tsx         safety trend charts
    services.tsx          nearby hospitals / police / pharmacy
    report.tsx            incident reporting form
    profile.tsx           emergency contacts
    settings.tsx          theme, language, offline mode
    notifications.tsx     notification centre
  components/safepath/
    Shell.tsx             header + bottom nav + SOS button
    MapCanvas.tsx         SVG map, routes, heatmap, vehicle simulation
    SafetyRing.tsx        animated AI safety score ring
    VoiceAssistant.tsx    mic FAB, listening sheet, subtitles, reroute dialog
  lib/
    voice.ts              speech recognition hook, TTS, command parser, guidance
    app-state.tsx         global settings (theme, language, offline)
    trip-state.tsx        selected destination / active trip
    i18n.ts               EN / TA / HI / TE / KN / ML strings
  data/safepath.ts        dummy Indian landmarks + AI safety-score engine
  styles.css              Material 3 design tokens, dark mode, animations
```

## 7. Making it an Android app (optional)

The project is a mobile-styled web app. To wrap it as an installable Android app:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init SafePathAI com.safepath.ai --web-dir=dist
npm run build
npx cap add android
npx cap sync
npx cap open android      # requires Android Studio
```

Add microphone permission in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Troubleshooting

- **`npm install` fails** → check `node -v` is 20+; delete `node_modules` and `package-lock.json`, retry.
- **Port 8080 in use** → `npm run dev -- --port 3000`.
- **Mic button does nothing** → you're not in Chrome/Edge, or not on `localhost`/HTTPS. Use the
  typed-command box in the voice sheet.
- **Blank page after edits** → check the VS Code terminal for the red error line.
