"use client";

/**
 * Lecture audio des consignes (Web Speech API) — accessibilité pour les
 * lecteurs débutants (CE2). Aucune dépendance, fr-FR, débit ralenti adapté
 * aux enfants. Silencieusement inopérant si le navigateur ne supporte pas
 * speechSynthesis (l'UI masque alors le bouton via isTtsSupported).
 */

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "fr-FR") ??
    voices.find((v) => v.lang.startsWith("fr")) ??
    null
  );
}

/** Lit `text` à voix haute (coupe toute lecture en cours). */
export function speak(text: string): void {
  if (!isTtsSupported() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.92; // légèrement ralenti pour les enfants
  const voice = pickFrenchVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}
