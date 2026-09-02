# Fly Masters — Mobile App

Native mobile app for Fly Masters / Fly AI Pathfinder, built with **Capacitor 7** wrapping the React web app.

## What's included

- **Android project** (`android/`) — ready to open in Android Studio
- **Student mobile UI** — bottom tab bar (Home, Universities, Documents, Chat, More)
- **Counselor mobile UI** — bottom tab bar (Home, Leads, Students, Chat, More)
- **Public mobile UI** — bottom nav on homepage, chat, universities, travel
- **Capacitor plugins** — StatusBar, SplashScreen, Keyboard, App (back button)
- **API routing** — mobile app calls your dev server or deployed backend via `VITE_API_URL`

## Quick start (Android)

### 1. Start the backend (required)

The mobile app is a frontend shell. PostgreSQL + Vite must be running:

```powershell
cd "e:\fly-ai-pathfinder-main (1)\fly-ai-pathfinder-main"
npm run dev
```

Dev server runs at **http://localhost:8087**.

### 2. Build and sync

```powershell
npm run mobile:build
```

### 3. Open in Android Studio

```powershell
npm run mobile:android
```

Then run on an emulator or physical device from Android Studio.

### 4. Physical device on same Wi‑Fi

Create `.env` with your PC's LAN IP:

```
VITE_API_URL=http://192.168.1.10:8087
```

Rebuild (`npm run mobile:build`) before syncing again.

> Android emulator automatically uses `http://10.0.2.2:8087` when `VITE_API_URL` is unset.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run mobile:build` | Production build + `cap sync` |
| `npm run mobile:android` | Build, sync, open Android Studio |
| `npm run mobile:run:android` | Build, sync, run on connected device/emulator |
| `npm run mobile:ios` | Build, sync, open Xcode (Mac only) |

## Mobile UX by role

### Public (not logged in)
Bottom tabs: Home · AI Chat · Universities · Travel

### Student (`/student/*`)
- Top header with notifications bell
- Bottom tabs: Home · Universities · Documents · Chat · More
- More sheet: Profile, Shortlists, Applications, Telecaller, Notifications

### Counselor (`/counselor/*`)
- Top header with back navigation
- Bottom tabs: Home · Leads · Students · Chat · More
- More sheet: Shortlists, Documents, Notifications, Profile, Leave, Attendance, Salary

## iOS (Mac required)

```bash
npx cap add ios
npm run mobile:ios
```

## PWA (no app store)

Users can also install from the mobile browser via the PWA install prompt — no Android Studio needed.

## Production deployment

For a store-ready app without a local dev server:

1. Deploy the Vite app + PostgreSQL API to a hosted URL
2. Set `VITE_API_URL=https://your-api.example.com` before building
3. Run `npm run mobile:build` and submit to Play Store / App Store

---

App ID: `in.flymasters.app`  
App name: **Fly Masters**
