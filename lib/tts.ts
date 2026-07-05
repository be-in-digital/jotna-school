"use client";

/**
 * Lecture audio des consignes — voix de Pio d'abord, navigateur en secours.
 *
 * Deux moteurs derrière un seul `speak(text)` :
 *  1. MP3 pré-synthétisé avec la voix de Pio (OpenAI TTS, convex/promptAudio)
 *     quand la consigne est enregistrée dans le registre (session de palier) ;
 *  2. sinon Web Speech API (fr-FR, débit ralenti), comme avant.
 *
 * Silencieusement inopérant si rien n'est disponible (l'UI masque alors le
 * bouton via isTtsSupported / hasPioAudio).
 */

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ---------------------------------------------------------------------------
// Registre « voix de Pio » : consigne exacte → URL du MP3. Rempli par la
// session de palier dès que getExercisesForPalier renvoie les URLs (elles
// arrivent en réactif au fil de la synthèse). speak() le consulte en premier,
// si bien que TOUT appelant (bouton 🔊, auto-lecture CI/CP) bascule sur la
// voix de Pio sans changer d'API.
// ---------------------------------------------------------------------------
const pioAudioByText = new Map<string, string>();
let currentClip: HTMLAudioElement | null = null;

export function registerPioAudio(
  entries: Array<{ text: string; url: string }>,
): void {
  for (const { text, url } of entries) {
    pioAudioByText.set(text, url);
  }
}

export function clearPioAudio(): void {
  pioAudioByText.clear();
}

export function hasPioAudio(text: string): boolean {
  return pioAudioByText.has(text);
}

function stopClip(): void {
  if (currentClip) {
    // Détache les callbacks avant de couper : un stop volontaire ne doit pas
    // déclencher le onend de l'ancien clip par-dessus la nouvelle lecture.
    currentClip.onended = null;
    currentClip.onerror = null;
    currentClip.onplay = null;
    currentClip.pause();
    currentClip = null;
  }
}

// ---------------------------------------------------------------------------
// Mode « lecteur débutant » (CI/CP — l'enfant apprend à lire). Mémo local de
// session, posé par la page d'exercices selon la classe du topic : les
// consignes sont alors lues automatiquement et le bouton d'écoute devient
// plus visible. Même pattern module-scope que lib/sounds.setSoundEnabledLocal.
// ---------------------------------------------------------------------------
let earlyReaderMode = false;

export function setEarlyReaderMode(enabled: boolean): void {
  earlyReaderMode = enabled;
}

export function isEarlyReaderMode(): boolean {
  return earlyReaderMode;
}

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "fr-FR") ??
    voices.find((v) => v.lang.startsWith("fr")) ??
    null
  );
}

/**
 * Lit `text` à voix haute (coupe toute lecture en cours). Voix de Pio (MP3
 * du registre) quand elle existe, sinon voix du navigateur. Sert aussi de
 * fallback à « Pio t'explique » : `onend` est appelé à la fin (ou tout de
 * suite si aucune lecture n'est possible) pour enchaîner les segments.
 */
export function speak(
  text: string,
  opts?: { onstart?: () => void; onend?: () => void },
): void {
  const pioUrl = pioAudioByText.get(text);
  if (pioUrl) {
    speakPioClip(pioUrl, text, opts);
    return;
  }
  speakWithBrowserVoice(text, opts);
}

/** MP3 voix de Pio ; toute défaillance rebascule sur la voix navigateur. */
function speakPioClip(
  url: string,
  text: string,
  opts?: { onstart?: () => void; onend?: () => void },
): void {
  stopSpeaking();
  const clip = new Audio(url);
  currentClip = clip;
  clip.onplay = () => opts?.onstart?.();
  clip.onended = () => {
    if (currentClip === clip) currentClip = null;
    opts?.onend?.();
  };
  clip.onerror = () => {
    if (currentClip === clip) currentClip = null;
    speakWithBrowserVoice(text, opts);
  };
  clip.play().catch(() => {
    // Autoplay refusé ou réseau — la voix navigateur prend le relais.
    if (currentClip === clip) currentClip = null;
    speakWithBrowserVoice(text, opts);
  });
}

function speakWithBrowserVoice(
  text: string,
  opts?: { onstart?: () => void; onend?: () => void },
): void {
  if (!isTtsSupported() || !text.trim()) {
    opts?.onend?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.92; // légèrement ralenti pour les enfants
  const voice = pickFrenchVoice();
  if (voice) utterance.voice = voice;
  if (opts?.onstart) utterance.onstart = () => opts.onstart?.();
  if (opts?.onend) {
    utterance.onend = () => opts.onend?.();
    utterance.onerror = () => opts.onend?.();
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  stopClip();
  if (isTtsSupported()) window.speechSynthesis.cancel();
}
