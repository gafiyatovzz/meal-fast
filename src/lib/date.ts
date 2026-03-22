/** Returns YYYY-MM-DD in the user's local timezone */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Today's date as YYYY-MM-DD in the user's local timezone */
export function today(): string {
  return localDateStr(new Date())
}

/** Adds n days to a YYYY-MM-DD string, returns YYYY-MM-DD */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return localDateStr(new Date(y, m - 1, d + n))
}

/** Formats a YYYY-MM-DD string for display with Russian locale (e.g. "воскресенье, 22 марта") */
export function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('ru', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

/** Formats a YYYY-MM-DD string as short Russian date (e.g. "22.3") */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('ru', {
    day: 'numeric', month: 'numeric',
  })
}
