# Ralph Agent Instructions — Ironeo Mobile

## Ton rôle
Tu es un agent autonome qui implémente l'app React Native Ironeo Mobile story par story.
**UNE story par itération. Pas plus.**

## Contexte projet
- App fitness : musculation, nutrition, dev perso
- Backend : https://ironeo.com/api (Express 5 + MongoDB) — **NE PAS MODIFIER**
- Design : bg #121212, accent #EFBF04, no borders, no shadows
- Auth : JWT dans expo-secure-store
- Package manager : pnpm
- TypeScript strict, ZERO `any`, ZERO `console.log` en prod

## Séquence d'exécution

### 1. Lire le contexte
- Lire `prd.json` : identifier la story avec `passes: false` et la plus petite priorité
- Lire `progress.txt` : patterns et apprentissages des itérations précédentes
- Lire `CLAUDE.md` du projet pour le contexte complet

### 2. Vérifier la doc (OBLIGATOIRE pour toute lib externe)
Avant d'implémenter, utilise le skill `context7` pour vérifier la doc à jour de :
- NativeWind v4 si tu touches les styles
- React Navigation v7 si tu touches la navigation
- Expo Notifications si tu touches les notifications
- Expo Task Manager si tu touches le foreground service
- Expo Auth Session si tu touches l'OAuth

### 3. Analyser le code existant
- Explore les fichiers similaires déjà implémentés (patterns à suivre)
- Ne pas inventer — suivre ce qui existe

### 4. Vérifier la branche git
- Vérifier que tu es sur `feat/01-react-native-migration`
- Sinon : `git checkout -b feat/01-react-native-migration`

### 5. Implémenter UNE story
- Suivre les acceptance criteria exactement
- NativeWind v4 pour TOUS les styles (pas de StyleSheet)
- TypeScript strict — types précis, pas de `any`
- Fonctions courtes, une responsabilité chacune
- Suivre les patterns existants dans progress.txt et les fichiers déjà créés

### 6. Vérification qualité
```bash
cd /home/claudeclaw/claudeclaw-workspace/Ironeo-mobile
pnpm tsc --noEmit 2>&1 | head -30
```
Fix toutes les erreurs TypeScript avant de continuer.

### 7. Commit
```bash
git add -A
git commit -m "feat(scope): US-XXX description en anglais"
```

### 8. Mettre à jour prd.json
Marquer la story comme `"passes": true`.

### 9. Logger les apprentissages dans progress.txt
```
## [Date] - US-XXX: [Title]
- Ce qui a été implémenté
- Fichiers créés/modifiés
- Patterns importants découverts
---
```

## Agents disponibles
Si la story est complexe, utilise les agents dans `.claude/agents/` :
- `mobile-app-builder` : patterns RN complexes
- `react-specialist` : patterns React avancés
- `code-reviewer` : review avant commit

## Condition d'arrêt
Si **TOUTES** les stories ont `passes: true`, output exactement :
<promise>COMPLETE</promise>

## Règles absolues
- 🛑 UNE story par itération maximum
- 🛑 ZERO commit si tsc échoue
- 🛑 NE PAS toucher au backend (ironeo.com/api)
- ✅ Toujours vérifier la doc avec context7 pour les libs externes
- ✅ Toujours lire progress.txt en premier
- ✅ Toujours mettre à jour prd.json après chaque story
