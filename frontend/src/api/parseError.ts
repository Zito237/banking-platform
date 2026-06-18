/** Extrait un message lisible depuis n'importe quelle réponse d'erreur axios */
export function parseError(err: any, fallback = 'Une erreur est survenue.'): string {
  const data = err?.response?.data
  if (!data) return err?.message ?? fallback

  const msg = data.message ?? data.error ?? data
  if (typeof msg === 'string') return msg
  if (typeof msg === 'object') {
    const values = Object.values(msg as Record<string, unknown>)
      .filter((v) => typeof v === 'string')
    if (values.length) return (values as string[]).join('. ')
  }
  return fallback
}
