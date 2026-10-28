import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  /** Optional unix socket (used when host Docker port publish is unavailable). */
  DB_SOCKET: Env.schema.string.optional(),

  /**
   * Set to "1" to enable the daily EPSS sync cron inside the web process.
   */
  START_CRON: Env.schema.string.optional(),

  /**
   * Cron expression for EPSS sync (default: every day at 16:00 Asia/Tehran wall clock
   * when process TZ is Asia/Tehran).
   */
  EPSS_CRON: Env.schema.string.optional(),

  EPSS_CSV_URL: Env.schema.string.optional(),
  EPSS_CACHE_DIR: Env.schema.string.optional(),
})
