const WORDS_PER_MINUTE = 220;

/** Estimated reading time in whole minutes (minimum 1) for a Markdown body. */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const text = body
    .replace(/```[\s\S]*?```/g, match => match.split(/\s+/).slice(0, 40).join(" "))
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/[#>*_`~[\]()-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
