# Ironeo Mobile — CLAUDE.md

## Projet
App fitness (musculation, nutrition, dev perso) — version React Native + Expo.
Web desktop : ironeo.com (React 19 + Vite, repo séparé `ironeo`)
Backend commun : ironeo.com/api (Express 5, MongoDB, ne pas toucher)

## Stack
- Expo SDK latest + React Native
- TypeScript strict (ZERO `any`)
- NativeWind v4 (Tailwind classes dans RN)
- React Navigation v7 (Bottom Tabs + Stack)
- Expo Notifications (push + reminders)
- Expo Task Manager + Background Fetch (foreground service timer)
- Google OAuth via Expo Auth Session
- LemonSqueezy : WebView in-app

## Design System "Dark Simplified"
- Background : #121212
- Accent : #EFBF04 (gold)
- Pas de bordures ni ombres sur les cards
- Surfaces : rgba(255,255,255, 0.02 à 0.08) → NativeWind `bg-white/[0.02]` etc.
- Police : system font, clean
- Toasts : feedback visuel léger, pas de modals lourds

## Navigation mobile
Bottom Tab Navigator — 5 onglets :
1. **Home** — dashboard, stats rapides
2. **Workout** — sessions, programmes, exercices, timer actif
3. **Social** — classements, badges, amis
4. **Learn** — articles, quiz, parcours
5. **Profile** — compte, social, settings

## Auth
- JWT via ironeo.com/api/auth
- Google OAuth via Expo Auth Session
- Stockage token : expo-secure-store

## Package manager
`pnpm` toujours (sauf si Expo impose npm pour un plugin natif)

## Standards
- Un composant = un fichier
- Fonctions courtes, une responsabilité
- ZERO `console.log` en prod
- ZERO `any` TypeScript
- Suivre les patterns existants avant d'en inventer

## Commits
Format : `type(scope): description` en anglais, < 72 chars
Exemples : `feat(auth): add Google OAuth flow`, `feat(timer): implement foreground notification service`
Committer après chaque feature complète.

## Agents disponibles
Voir `.claude/agents/` — mobile-app-builder, code-reviewer, react-specialist, etc.
