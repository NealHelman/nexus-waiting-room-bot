export function isValidAnswer(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 10) return false; // arbitrary minimum length
  return true;
}
