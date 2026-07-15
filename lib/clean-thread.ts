// Strips quoted-reply cruft from a pasted email thread so we don't burn
// tokens on text the model would see repeated in every quoted layer.

const ATTRIBUTION_LINE = /^\s*(?:>+\s*)?On\s.{3,120}?\b(?:wrote|sent):?\s*$/i;
const FORWARD_MARKER =
  /^\s*(?:>+\s*)?-{2,}\s*(?:Original Message|Forwarded message|Reply above this line)\s*-{2,}\s*$/i;
// Sent/Date/Subject header lines are noise; From/To/Cc are kept because in
// Outlook-style bottom-posted chains they are the only record of who wrote what.
const NOISE_HEADER_LINE = /^\s*(?:>+\s*)?(?:Sent|Date|Subject):\s.*$/i;

function stripLines(raw: string, dropQuoted: boolean): string {
  const kept: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (ATTRIBUTION_LINE.test(line)) continue;
    if (FORWARD_MARKER.test(line)) continue;
    if (NOISE_HEADER_LINE.test(line)) continue;
    if (line.trimStart().startsWith(">")) {
      if (dropQuoted) continue;
      // Keep the content but shed the ">>> " gutter characters.
      kept.push(line.replace(/^\s*(?:>\s?)+/, ""));
      continue;
    }
    kept.push(line);
  }
  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanThread(raw: string): string {
  const aggressive = stripLines(raw, true);
  // If the paste was a single email whose history lives entirely in quoted
  // lines, dropping them would delete the thread. In that case fall back to
  // keeping quoted content and only shedding the "> " gutters and headers.
  if (aggressive.length < Math.min(200, raw.length * 0.2)) {
    return stripLines(raw, false);
  }
  return aggressive;
}
