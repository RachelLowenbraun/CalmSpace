# PTSD Shield — Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g eas-cli`)
- Supabase account
- Apple Developer account (for iOS sign-in + App Store)
- Google Cloud Console project (for Google sign-in)

## 1. Environment Variables

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your
Supabase project dashboard → Settings → API.

## 2. Supabase Setup

1. Create a new Supabase project
2. Run the migration:
   ```bash
   # Using Supabase CLI
   supabase db push
   # OR paste supabase/migrations/001_init.sql into the SQL editor
   ```
3. Enable Google OAuth: Authentication → Providers → Google
4. Enable Apple OAuth: Authentication → Providers → Apple
5. Add redirect URL: `ptsdshield://auth/callback`

## 3. YAMNet Model

Download the YAMNet TFLite model and convert it for TF.js:

```bash
pip install tensorflow tensorflowjs
tensorflowjs_converter \
  --input_format=tf_hub \
  https://tfhub.dev/google/yamnet/1 \
  assets/yamnet/
```

Or download pre-converted files from:
https://www.kaggle.com/models/google/yamnet/tfJs/tfjs/1

Place `model.json` and `weights.bin` in `assets/yamnet/`.

## 4. Running Locally

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to test UI.
Note: YAMNet inference requires an EAS dev client build (see step 5).

## 5. Building with EAS

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Development build (includes native modules, runs on device)
eas build --profile development --platform all

# Production build
eas build --profile production --platform all
```

## 6. Configuring Background Audio (iOS)

Background audio is configured via `app.json` → `ios.infoPlist.UIBackgroundModes: ["audio"]`.
This is automatically included in EAS builds.

## 7. Android Foreground Service

For persistent background scanning on Android, the app uses `expo-av` with
`staysActiveInBackground: true`. For production, add `react-native-foreground-service`
to display a persistent notification while the shield is active.

## Architecture Notes

- **Sound classification**: YAMNet via TF.js React Native (521 sound classes, fully on-device)
- **Audio synthesis**: Web Audio API inside a hidden WebView (works on both platforms)
- **Auth**: Supabase OAuth (Google + Apple)
- **Logging**: Trigger events and intervention sessions stored in Supabase with RLS
- **State**: Zustand store (`src/stores/shieldStore.ts`)
- **Shield state machine**: IDLE → MONITORING → INTERVENING (see `src/engine/ShieldController.ts`)
