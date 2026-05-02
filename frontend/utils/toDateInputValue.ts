/** Normalizes API date strings to `YYYY-MM-DD` for `<input type="date" />`. */
export function toDateInputValue(isoOrYmd: string): string {
  if (!isoOrYmd) return "";
  const m = isoOrYmd.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : isoOrYmd.slice(0, 10);
}
