# PROMPT GLOBAL — Module Mock Interview PRSTO

## 1. DEMANDE INITIALE

Créer un module SaaS de simulation d'entretien pour cadres dirigeants intégré à PRSTO (Next.js 16), avec :

- **STT** : Reconnaissance vocale native navigateur via Web Speech API (webkitSpeechRecognition/SpeechRecognition). 8 langues. Zéro téléchargement de modèle, gratuit, instantané.
- **LLM** : NVIDIA NIM API (DeepSeek V4 Pro, 40 req/min, OpenAI-compatible). Gratuit.
- **TTS** : Speech Synthesis API native navigateur. Gratuit.
- **Base de données** : Supabase PostgreSQL, coexistant avec Prisma/SQLite existant.
- **Multilingue** : FR, EN, ES, DE, PT, AR, JA, IT.
- **Quota** : PRSTO+ 4 simulations/semaine. Session unique 19,90€ sans abonnement.
- **Zéro Robot** : Questions contextuelles, rebond (follow-up), alternance speakers.
- **UI** : Fond ivory `#FAF6EF`, accents vert forêt `#103826`. Pas de dark theme.
- **Portraits** : 6 profils (DRH, CEO, CTO, Marketing, RH, Conseil). Images PNG fixes par rôle.
- **Animation Canvas 2D** : Respiration, micro-mouvement, bouche synchronisée TTS, clignement d'yeux, vignette.
- **Pricing** : PRSTO+ 9,90€/sem (4 simuls/sem max). Session unique 19,90€.
- Pas de mention "DeepSeek", "NVIDIA NIM", "Whisper", "MediaPipe" dans les textes publics.

## 2. ARCHITECTURE ET FICHIERS

### Structure
```
app/(public)/mock-interview/page.tsx       → Landing page (carrousel, pricing)
app/(app)/mock-interview/setup/page.tsx    → Formulaire de configuration
app/(app)/mock-interview/session/page.tsx  → Session d'entretien en direct
components/mock-interview/
  AnimatedPortrait.tsx                     → Canvas 2D portrait animé
  AuditReport.tsx                          → Rapport d'audit final
  CandidateWebcam.tsx                      → Flux webcam candidat
  InterviewStatus.tsx                      → Métriques en direct
  SetupForm.tsx                            → Formulaire config (portraits, poste, etc.)
hooks/
  useInterviewOrchestrator.ts              → Orchestrateur principal (connecte tout)
  useInterviewLoop.ts                      → Boucle Q/R (speak → listen → transcribe → analyze)
  useNativeSTT.ts                          → Web Speech API wrapper (remplace Whisper WASM)
  useMediaPipeline.ts                      → Accès caméra/micro
  useMediaPipe.ts                          → Détection posture/regard
  useAudioAnalytics.ts                     → Analyse WPM, silence ratio
lib/ai/
  prompts-mock-interview.ts                → 3 prompts LLM (Prep, Loop, Audit)
  deepseek.ts                              → Client NVIDIA NIM API
lib/actions/
  mock-interview.ts                        → Server actions (generateWithLLM, quota, portraits)
```

### Flux utilisateur
1. `/mock-interview` → landing page (carrousel, pricing)
2. Clic "Commencer" → `/mock-interview/setup` → formulaire (poste, entreprise, forces, langue, sélection 2-6 portraits)
3. Clic "Préparer" → appel LLM (Prep prompt) → stocke config + questions dans `sessionStorage`
4. Redirection → `/mock-interview/session` → affiche portraits + bouton "Démarrer l'entretien"
5. Clic "Démarrer" → démarre caméra, boucle Q/R :
   - `generating_question` → LLM génère question → phase passe à `speaking`
   - `speaking` → TTS lit la question à voix haute → phase passe à `listening`
   - `listening` → STT capture la réponse du candidat → clic "J'ai fini de répondre"
   - `transcribing` → finalise la transcription → `analyzing` → LLM analyse la réponse
   - Retour à `generating_question` ou `finished`
6. `finished` → appel LLM (Audit prompt) → affichage du rapport

### États du InterviewLoop (phase)
```
"idle" | "generating_question" | "speaking" | "listening" | "transcribing" | "analyzing" | "finished"
```

## 3. CE QUI A ÉTÉ FAIT (constructif)

### Landing page
- Carrousel repensé : photo 110×110 en haut à gauche, nom/titre à droite, texte full-width, hauteur fixe `h-[400px]`
- Auto-play 12s par profil, pause au survol
- Pricing point 3 réécrit (argument pro-commercial)

### Setup page
- Formulaire complet : entreprise, poste, description, forces, langue (8 langues), sélection portraits
- Quota check via Supabase
- Appel LLM pour générer personas + 5 questions
- Fallback questions si LLM échoue
- Stockage dans sessionStorage

### Session page (v2 redesign)
- Layout speaker (haut, portrait animé 360px) + question (centre, carte blanche) + webcam candidat (droite) + métriques (droite)
- Transcription en direct affichée en bas pendant le listening
- Bouton "J'ai fini de répondre" pendant le listening
- Barre de statut en haut (entreprise + poste + bouton "Terminer")
- Gestion des phases : idle (démarrage), speaking, listening, transcribing, analyzing, finished
- Fallback portrait : utilise `selectedPortraitIds` du form si les IDs LLM ne matchent pas

### AnimatedPortrait (Canvas 2D)
- Respiration : échelle sinusoïdale 1.5%
- Micro-mouvement : sway X/Y
- Bouche synchronisée : ellipse qui s'ouvre selon `audioAmplitude` (position y = h*0.72, largeur = w*0.28)
- Clignement d'yeux : toutes les 3-7s, ellipse couleur #5a4a38 qui se ferme/ouvre en 120ms
- Bordure glow vert #103826 quand actif + speaking
- Tailles : sm=160px, md=220px, lg=360px

### useNativeSTT.ts
- Wrapper autour de `webkitSpeechRecognition` / `SpeechRecognition`
- `continuous: true`, `interimResults: true`
- Langue : mappée depuis le code langue (fr → fr-FR, en → en-US, etc.)
- `start()` : initialise recognition, écoute `onresult`
- `stop()` : async — crée une Promise qui attend `onend` puis résout avec le transcript
- `finalTranscriptRef` accumule uniquement les résultats `isFinal`
- L'affichage en direct combine finals + dernier interim

### useInterviewOrchestrator.ts
- Connecte tous les hooks : MediaPipeline, MediaPipe, AudioAnalytics, NativeSTT, InterviewLoop
- `onSpeakQuestion` : TTS via SpeechSynthesis — attend `voiceschanged` si voices pas encore chargées, cherche Google > Amélie > Thomas > any French voice
- `onStartListening` : lance nativeSTT.start()
- `onStopListening` : await nativeSTT.stop() → retourne un Blob dummy
- `onTranscribe` : retourne transcriptRef.current
- `initialize()` : passe de "idle" à "ready" instantanément (plus de chargement modèle)

### useInterviewLoop.ts
- Boucle Q/R complète
- `startInterview()` : initialise les questions, panel IDs, lance `runQuestionCycle`
- `runQuestionCycle()` : génère question → speak → listen → transcribe → analyze → récursion
- `stopListening()` : résout la promesse d'écoute déclenchée par l'UI (bouton "J'ai fini")
- Timeout 60s si l'utilisateur ne clique pas
- `generateNextQuestion()` : utilise les questions préparées, puis LLM si plus de questions
- `analyzeResponse()` : décide next_question / follow_up / conclude

### Build
- 120 pages statiques générées
- Aucune erreur TypeScript
- Next.js 16.2.9 (Turbopack)

## 4. CE QUI NE FONCTIONNE PAS (bugs à corriger)

### BUG 1 — Transcription bloquée après clic "J'ai fini de répondre"
**Symptôme** : Après avoir parlé et cliqué sur "J'ai fini de répondre", le message "Transcription de votre réponse..." s'affiche avec un spinner et ne bouge plus jamais (plusieurs minutes).

**Cause probable** : Dans `useNativeSTT.ts`, la fonction `stop()` crée une Promise qui attend l'événement `onend` :
```ts
return new Promise<string>((resolve) => {
  const originalOnEnd = recognition.onend;
  recognition.onend = () => { ... resolve(transcript); };
  recognition.stop();
});
```
Si le `recognition.onend` a DÉJÀ été déclenché (par exemple si la reconnaissance s'est arrêtée automatiquement après du silence), appeler `recognition.stop()` ne redéclenche PAS `onend` une seconde fois → la Promise ne se résout jamais → tout le flux est bloqué.

**Solution** :
1. Dans le handler `onend` du `start()`, mettre aussi `recognitionRef.current = null`
2. Dans `stop()`, ajouter un timeout de 3 secondes maximum
3. OU ajouter un flag `isActiveRef` pour savoir si la reconnaissance tourne encore

```ts
// Dans start() — ajouter à onend :
recognition.onend = () => {
  recognitionRef.current = null;  // ← MARQUER INACTIF
  setState((s) => ({ ...s, isListening: false }));
};

// Dans stop() — ajouter timeout :
return new Promise<string>((resolve) => {
  const timeout = setTimeout(() => {
    const transcript = finalTranscriptRef.current.trim();
    setState((s) => ({ ...s, isListening: false, transcript }));
    resolve(transcript);
  }, 3000);  // fallback après 3s

  const originalOnEnd = recognition.onend;
  recognition.onend = () => {
    clearTimeout(timeout);
    if (typeof originalOnEnd === "function") originalOnEnd();
    const transcript = finalTranscriptRef.current.trim();
    setState((s) => ({ ...s, transcript }));
    resolve(transcript);
  };
  recognition.stop();
});
```

### BUG 2 — Transcription coupe au milieu des phrases
**Symptôme** : La transcription en direct affiche le début de la phrase puis s'arrête avant la fin.

**Cause probable** : La Web Speech API détecte une pause/silence et marque le résultat comme "final" prématurément. Ou la langue configurée ne correspond pas à la langue parlée. Ou le navigateur impose une limite de temps.

**Solution** :
- Vérifier que `continuous: true` est bien actif
- Vérifier que la langue dans `LANG_MAP` correspond bien à la langue du formulaire
- Ajouter `recognition.interimResults = true` (déjà fait)
- Sur Chrome, le continuous mode est parfois limité à ~60s d'écoute continue

### BUG 3 — Portrait supplémentaire non sélectionné
**Symptôme** : L'utilisateur a sélectionné 2 portraits mais un 3ème portrait (chauve) apparaît en petit en dessous.

**Cause** : Le `prep.personas` généré par le LLM contient plus d'entrées que le nombre de portraits sélectionnés. Le code de mapping dans le session page utilise `selectedPortraitIds` mais le LLM peut générer plus de personas que demandé.

**Solution** : Limiter l'affichage au nombre de portraits sélectionnés :
```ts
portraitDisplays.slice(0, config.selectedPortraitIds.length)
```
Ou filtrer pour n'afficher que les portraits qui matchent les `selectedPortraitIds`.

### BUG 4 — Voix TTS toujours robotique
**Symptôme** : La voix de synthèse vocale sonne comme un robot, pas humaine.

**Cause** : Sur certains OS/navigateurs, même les meilleures voix disponibles via SpeechSynthesis sont limitées. La fonction de sélection cherche Google > Amélie > Thomas mais ces voix ne sont pas toujours disponibles.

**Solution** : La seule vraie solution pour une voix humaine est une API externe pay-as-you-go comme ElevenLabs (~0.015$/minute, pas d'abonnement fixe). Intégration simple : appel API REST avec streaming audio, jouer via Web Audio API.

### BUG 5 — Flow général instable
**Cause** : La chaîne de Promises entre useNativeSTT → useInterviewOrchestrator → useInterviewLoop est fragile. Un seul maillon qui ne résout pas sa Promise bloque tout.

**Solution** : Ajouter des timeouts partout (3-5s max pour chaque étape asynchrone), et des mécanismes de reprise (retry) quand une étape échoue silencieusement.

## 5. FICHIERS CLÉS À MODIFIER POUR CORRIGER

### Priorité 1 — useNativeSTT.ts (lignes ~83-101)
Ajouter `recognitionRef.current = null` dans le `onend` de `start()`.
Ajouter un timeout de 3s dans la Promise de `stop()`.

### Priorité 2 — useInterviewLoop.ts (lignes ~258-283)
Ajouter un timeout sur `onTranscribe` et `onStopListening`.
Gérer le cas où le transcript est vide (proposer de réessayer au lieu de bloquer).

### Priorité 3 — session/page.tsx (Portrait filtering)
Limiter l'affichage à `portraitDisplays.slice(0, config.selectedPortraitIds.length)`.

## 6. EXIGENCES FONCTIONNELLES À RESPECTER
- Zéro modèle à télécharger côté client
- Zéro abonnement SaaS payant
- Utiliser les APIs navigateur gratuites (Web Speech, Speech Synthesis)
- NVIDIA NIM API reste l'API LLM (gratuite, suffisante pour générer des questions)
- Pas de mention des technologies internes dans les textes publics
