/**
 * Normalizes a code string for consistent lookup and storage.
 * Trims and removes all whitespace so "CSC 101" and "CSC101" are treated the same.
 */
export function normalizeCode(code: string): string {
  if (typeof code !== 'string') return code;
  return code.trim().replace(/\s+/g, '');
}
