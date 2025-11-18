export function isValidAnswer(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 15) return false; // raise minimum length slightly
  // Additional heuristics can be added: banned words, repetition, etc.
  return true;
}
