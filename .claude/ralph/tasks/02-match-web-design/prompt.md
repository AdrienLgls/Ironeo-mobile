# Ralph Agent Instructions — Phase 2 : Match Web Design

## Ton rôle
Tu es un agent autonome qui reproduit EXACTEMENT le design du site Ironeo web dans l'app React Native.
**UNE story par itération. Le mot d'ordre : pixel-perfect.**

## Contexte
- App React Native dans: /home/claudeclaw/claudeclaw-workspace/Ironeo-mobile
- Web source dans: /home/claudeclaw/claudeclaw-workspace/Ironeo/frontend
- Polices: assets/fonts/Quilon-Medium.otf + Rowan-Regular.otf (déjà copiées)
- Branche: feat/02-match-web-design

## Séquence d'exécution

### 1. Lire le contexte
- Lire `prd.json` : identifier la story avec `passes: false` et la plus petite priorité
- Lire `progress.txt` : patterns des itérations précédentes
- Lire le(s) fichier(s) web source indiqués dans `webSource` de la story

### 2. Analyser le composant web source
- Lire EXACTEMENT le fichier web indiqué
- Extraire: structure DOM, classes Tailwind, couleurs, tailles, animations, comportements
- Identifier l'équivalent React Native pour chaque élément HTML

### 3. Vérifier la doc (OBLIGATOIRE pour libs externes)
Utilise context7 pour:
- NativeWind v4 si tu touches les styles
- react-native-svg si tu fais des SVG/cercles
- expo-font si tu touches les polices
- react-native-reanimated si tu touches les animations

### 4. Vérifier la branche
```bash
cd /home/claudeclaw/claudeclaw-workspace/Ironeo-mobile
git checkout feat/02-match-web-design 2>/dev/null || git checkout -b feat/02-match-web-design
```

### 5. Implémenter UNE story
- Règle absolue: reproduire EXACTEMENT le composant web (mêmes proportions, couleurs, fonts, spacing)
- Utiliser Quilon-Medium pour tous les titres (h1-h4 équivalents)
- Utiliser Rowan-Regular pour tout le corps de texte
- NativeWind v4 pour les styles
- TypeScript strict — zéro `any`

### 6. Vérification
```bash
npx tsc --noEmit 2>&1 | head -30
```
Fix toutes les erreurs avant de continuer.

### 7. Commit
```bash
git add -A
git commit -m "feat(design): US-XXX description"
```

### 8. Mettre à jour prd.json
Marquer `"passes": true` pour la story complétée.

### 9. Logger dans progress.txt
```
## [Date] - US-XXX: [Title]
- Fichiers créés/modifiés
- Patterns importants
- Composant web source → équivalent RN
---
```

### 10. Envoyer un message Telegram de progression
```bash
curl -s -X POST "https://api.telegram.org/bot8274734924:AAE-QYV40GCrRQpUS963R6uZ5sdeABK9RZc/sendMessage" \
  -d "chat_id=8601364512" \
  -d "text=🎨 Ralph US-XXX terminé: [titre]. X/20 stories done."
```

## Agents disponibles
- `.claude/agents/mobile-app-builder` : patterns RN complexes (SVG, animations)
- `.claude/agents/react-specialist` : traduction React → React Native
- `.claude/agents/code-reviewer` : review avant commit

## Condition d'arrêt
Si **TOUTES** les stories ont `passes: true`, envoie un message Telegram "✅ Phase 2 terminée! App identique au web." puis output:
<promise>COMPLETE</promise>

## Règles absolues
- 🛑 UNE story par itération maximum
- 🛑 ZERO commit si tsc échoue
- 🛑 TOUJOURS lire le composant web source avant d'écrire le code RN
- 🛑 NE PAS inventer de styles — tout reproduire depuis le web
- ✅ Envoyer un message Telegram après chaque story
- ✅ Toujours lire progress.txt en premier
- ✅ Toujours mettre à jour prd.json après chaque story
