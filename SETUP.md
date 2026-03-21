# Ironeo Mobile — Setup Guide

## Before Production Build

Fill in the following credentials before submitting to App Store / Play Store.

### 1. Google OAuth
In `app.json` → `expo.extra`:
- `googleAndroidClientId`: Get from [Google Cloud Console](https://console.cloud.google.com) → Credentials → Android OAuth client
- `googleIosClientId`: Get from Google Cloud Console → Credentials → iOS OAuth client
- `googleWebClientId`: Get from Google Cloud Console → Credentials → Web OAuth client

### 2. Sentry
In `constants/config.ts` → replace the empty `SENTRY_DSN`:
- Create project at [sentry.io](https://sentry.io)
- Copy DSN from Settings → Projects → Client Keys

### 3. EAS Project ID
In `eas.json` → `extra.eas.projectId`:
- Run `eas init` to create/link project at [expo.dev](https://expo.dev)
- Or create project manually at expo.dev and copy the project ID

### 4. Apple Sign-In Backend
Implement `POST /auth/apple` on the backend to handle Apple identity tokens.
