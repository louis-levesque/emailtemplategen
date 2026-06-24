/**
 * Returns the URL unchanged if it uses the http: or https: protocol.
 * Returns null for javascript:, data:, vbscript:, and any other protocol,
 * as well as for malformed or relative URLs.
 */
export function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the URL is non-empty and uses http: or https:.
 * Useful for inline validation in form fields.
 */
export function isValidHttpUrl(url: string): boolean {
  return safeUrl(url) !== null;
}
