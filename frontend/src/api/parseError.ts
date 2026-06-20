/** Extrait un message lisible depuis n'importe quelle réponse d'erreur axios.
 *  Gère les erreurs Feign imbriquées multi-niveaux (transaction-service → account-service).
 */

// Messages techniques → messages lisibles en français (correspondance exacte)
const ERROR_MAP: Record<string, string> = {
  'Solde insuffisant': 'Solde insuffisant sur le compte sélectionné.',
  'solde insuffisant': 'Solde insuffisant sur le compte sélectionné.',
  'Insufficient balance': 'Solde insuffisant sur le compte sélectionné.',
  'Account not found': 'Compte introuvable.',
  'Compte non trouve': 'Compte introuvable.',
  'Client non trouve': 'Client introuvable.',
  'Montant invalide': 'Le montant saisi est invalide.',
}

// Correspondances partielles pour les erreurs techniques de bas niveau
const PATTERN_MAP: Array<[string, string]> = [
  ['Violation d\'index unique', 'Solde insuffisant sur le compte sélectionné.'],
  ['unique constraint', 'Solde insuffisant sur le compte sélectionné.'],
  ['could not execute statement', 'Solde insuffisant sur le compte sélectionné.'],
  ['ConstraintViolationException', 'Solde insuffisant sur le compte sélectionné.'],
]

/**
 * Extrait le message le plus profond depuis une chaîne d'erreurs Feign imbriquées.
 * Applique l'extraction en boucle jusqu'à ce qu'il n'y ait plus de champ "error":"..." à désimbriquer.
 */
function extractDeepest(raw: string): string {
  let current = raw
  for (let i = 0; i < 6; i++) {
    if (!current.includes('"error"')) break
    const matches = [...current.matchAll(/"error"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
    if (matches.length === 0) break
    const next = matches[matches.length - 1][1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    if (next === current) break
    current = next
  }
  return current
}

export function parseError(err: any, fallback = 'Une erreur est survenue.'): string {
  const data = err?.response?.data
  if (!data) return err?.message ?? fallback

  // Récupère la valeur brute (message ou error)
  let raw: string
  const candidate = data.message ?? data.error

  if (typeof candidate === 'string') {
    raw = candidate
  } else if (candidate && typeof candidate === 'object') {
    const values = Object.values(candidate as Record<string, unknown>).filter((v) => typeof v === 'string')
    raw = values.length ? (values as string[]).join('. ') : fallback
  } else if (typeof data === 'string') {
    raw = data
  } else {
    return fallback
  }

  // Extrait le message le plus profond si la chaîne contient du JSON imbriqué (format Feign)
  const deepest = raw.includes('"error"') ? extractDeepest(raw) : raw

  // Exact match
  if (ERROR_MAP[deepest]) return ERROR_MAP[deepest]

  // Partial match for raw DB / technical errors
  for (const [pattern, msg] of PATTERN_MAP) {
    if (deepest.includes(pattern)) return msg
  }

  return deepest
}
