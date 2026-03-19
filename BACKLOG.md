# Ironeo Mobile — Backlog de migration

Ordre de priorité strict. Compléter chaque phase avant la suivante.
Backend : ironeo.com/api — NE PAS MODIFIER.

---

## Phase 1 — Setup (PRIORITÉ 1)
- [x] Initialiser projet Expo avec TypeScript : `pnpm create expo-app . --template blank-typescript`
- [x] Installer et configurer NativeWind v4
- [ ] Installer React Navigation v7 (Bottom Tabs + Stack)
- [ ] Configurer la structure de dossiers : `app/`, `components/`, `hooks/`, `services/`, `types/`
- [ ] Créer le Bottom Tab Navigator avec 4 onglets (Home, Workout, Learn, Profile)
- [ ] Configurer axios avec base URL ironeo.com/api et intercepteur JWT
- [ ] Implémenter l'écran Login (email/password → POST /api/auth/login)
- [ ] Implémenter l'écran Register (POST /api/auth/register)
- [ ] Google OAuth via Expo Auth Session
- [ ] Stockage du JWT via expo-secure-store
- [ ] Navigation auth : si non connecté → stack Auth, si connecté → Tab Navigator

## Phase 2 — Home Dashboard (PRIORITÉ 2)
- [ ] Écran Home : stats rapides (streak, workouts cette semaine, dernière session)
- [ ] Widget prochain entraînement
- [ ] Widget progression (poids, objectifs)
- [ ] Appels API : GET /api/users/stats, GET /api/workouts/recent

## Phase 3 — Workout + Timer (PRIORITÉ 3 — FEATURE CLÉ)
- [ ] Écran liste des programmes (GET /api/programs)
- [ ] Écran détail programme + exercices
- [ ] Écran session workout active
- [ ] Timer avec compte à rebours par série/repos
- [ ] Foreground service : expo-task-manager + expo-background-fetch
- [ ] Notification persistante avec timer actif (expo-notifications)
- [ ] Contrôles dans la notification (pause/reprendre/stop)
- [ ] Sauvegarde session en temps réel (POST /api/workout-sessions)
- [ ] Écran récapitulatif post-session

## Phase 4 — Programmes & Exercices (PRIORITÉ 4)
- [ ] Catalogue exercices (GET /api/exercises)
- [ ] Filtres par groupe musculaire
- [ ] Détail exercice avec instructions
- [ ] Créer/modifier programme custom
- [ ] Historique des sessions

## Phase 5 — Learn (PRIORITÉ 5)
- [ ] Liste articles (GET /api/articles)
- [ ] Lecture article
- [ ] Quiz (GET /api/quizzes)
- [ ] Parcours d'apprentissage

## Phase 6 — Profil & Social (PRIORITÉ 6)
- [ ] Écran profil (GET /api/users/me)
- [ ] Modifier profil
- [ ] Paramètres notifications
- [ ] Fonctionnalités sociales (groupes, amis)
- [ ] Settings app (thème, langue)

## Phase 7 — Paiement (PRIORITÉ 7)
- [ ] LemonSqueezy via WebView in-app
- [ ] Gestion statut subscription
- [ ] Paywall pour features Premium

---

## Règles pour l'agent autonome
1. Toujours travailler sur la phase la plus basse non complétée
2. Committer après chaque item complété
3. Ne pas toucher au backend (ironeo.com/api)
4. TypeScript strict — ZERO `any`
5. NativeWind pour tous les styles
6. Tester sur Expo Go avant de committer
