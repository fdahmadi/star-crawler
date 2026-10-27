import { createWriteStream } from 'node:fs'
import { mkdir, rename, unlink } from 'node:fs/promises'
import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { createReadStream } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import axios from 'axios'

const DEFAULT_CSV_URL = 'https://epss.empiricalsecurity.com/epss_scores-current.csv.gz'
const SCORE_DATE_RE = /score_date:(\d{4}-\d{2}-\d{2})/
const UPSERT_CHUNK = 2000

export type EpssRow = {
  cve: string
  epss: number
  percentile: number
  scoreDate: string
}

export type EpssSyncResult = {
  scoreDate: string
  sourceFile: string
  stored: number
}

export default class EpssSyncService {
  async sync(): Promise<EpssSyncResult> {
    const localPath = await this.ensureLocalFile()
    const { rows, scoreDate } = await this.parseCsv(localPath)
    await this.upsertRows(rows)

    logger.info('EPSS sync complete: stored=%s score_date=%s file=%s', rows.length, scoreDate, localPath)

    return {
      scoreDate,
      sourceFile: localPath.split('/').pop() || localPath,
      stored: rows.length,
    }
  }

  private cacheDir() {
    const configured = env.get('EPSS_CACHE_DIR') || 'tmp/epss-cache'
    return app.makePath(configured)
  }

  private csvUrl() {
    return env.get('EPSS_CSV_URL') || DEFAULT_CSV_URL
  }

  private async ensureLocalFile(): Promise<string> {
    const dir = this.cacheDir()
    await mkdir(dir, { recursive: true })

    const url = this.csvUrl()
    logger.info('Downloading EPSS CSV: %s', url)

    const tmpPath = join(dir, `epss_scores-download-${Date.now()}.csv.gz`)
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 120_000,
      maxRedirects: 5,
    })

    await pipeline(response.data, createWriteStream(tmpPath))

    const scoreDate = await this.readScoreDate(tmpPath)
    const finalPath = join(dir, `epss_scores-${scoreDate}.csv.gz`)

    try {
      await unlink(finalPath)
    } catch {
      // ignore missing previous file
    }
    await rename(tmpPath, finalPath)
    logger.info('Saved EPSS CSV: %s', finalPath)
    return finalPath
  }

  private async readScoreDate(gzPath: string): Promise<string> {
    const gunzip = createGunzip()
    const input = createReadStream(gzPath)
    const rl = createInterface({ input: input.pipe(gunzip), crlfDelay: Infinity })

    for await (const line of rl) {
      rl.close()
      input.destroy()
      gunzip.destroy()
      if (line.startsWith('#')) {
        const match = SCORE_DATE_RE.exec(line)
        if (!match) {
          throw new Error(`Could not parse score_date from: ${line}`)
        }
        return match[1]
      }
      // No metadata comment; fall back to UTC today
      return new Date().toISOString().slice(0, 10)
    }

    throw new Error(`EPSS CSV is empty: ${gzPath}`)
  }

  private async parseCsv(gzPath: string): Promise<{ rows: EpssRow[]; scoreDate: string }> {
    const gunzip = createGunzip()
    const input = createReadStream(gzPath)
    const rl = createInterface({ input: input.pipe(gunzip), crlfDelay: Infinity })

    let scoreDate = ''
    let headerSeen = false
    const rows: EpssRow[] = []

    for await (const line of rl) {
      if (!line.trim()) continue

      if (!scoreDate && line.startsWith('#')) {
        const match = SCORE_DATE_RE.exec(line)
        if (!match) {
          throw new Error(`Could not parse score_date from: ${line}`)
        }
        scoreDate = match[1]
        continue
      }

      if (!headerSeen) {
        headerSeen = true
        continue
      }

      const [cveRaw, epssRaw, percentileRaw] = line.split(',')
      const cve = (cveRaw || '').trim().toUpperCase()
      if (!cve) continue

      rows.push({
        cve,
        epss: Number(epssRaw),
        percentile: Number(percentileRaw),
        scoreDate,
      })
    }

    if (!scoreDate) {
      throw new Error(`Missing score_date in ${gzPath}`)
    }

    logger.info('Parsed %s EPSS rows (score_date=%s)', rows.length, scoreDate)
    return { rows, scoreDate }
  }

  private async upsertRows(rows: EpssRow[]) {
    const now = new Date()
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK)
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
      const bindings: Array<string | number | Date> = []

      for (const row of chunk) {
        bindings.push(row.cve, row.epss, row.percentile, row.scoreDate, now, now)
      }

      await db.rawQuery(
        `
        INSERT INTO epss_scores (cve, epss, percentile, score_date, created_at, updated_at)
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          epss = VALUES(epss),
          percentile = VALUES(percentile),
          score_date = VALUES(score_date),
          updated_at = VALUES(updated_at)
        `,
        bindings
      )
    }
  }
}
