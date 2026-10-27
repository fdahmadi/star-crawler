import EpssScore from '#models/epss_score'
import type { HttpContext } from '@adonisjs/core/http'

function normalizeCves(input: unknown): string[] {
  const values: string[] = []

  if (Array.isArray(input)) {
    for (const item of input) {
      values.push(String(item))
    }
  } else if (typeof input === 'string') {
    values.push(...input.split(','))
  }

  const unique = new Set<string>()
  for (const value of values) {
    const cve = value.trim().toUpperCase()
    if (cve) unique.add(cve)
  }
  return [...unique]
}

export default class EpssController {
  /**
   * GET  /epss?cve=CVE-1,CVE-2
   * POST /epss  { "cve": ["CVE-1", "CVE-2"] } or { "cve": "CVE-1,CVE-2" }
   */
  async index({ request, response }: HttpContext) {
    const fromQuery = request.input('cve') ?? request.qs().cve
    const fromBody = request.body()?.cve
    const cves = normalizeCves(fromQuery ?? fromBody)

    if (cves.length === 0) {
      return response.badRequest({
        error: 'Provide one or more CVE ids via ?cve= or JSON body { "cve": [...] }',
      })
    }

    const rows = await EpssScore.query().whereIn('cve', cves).orderBy('cve', 'asc')

    return {
      total: rows.length,
      requested: cves.length,
      data: rows,
    }
  }
}
