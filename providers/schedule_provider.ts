import EpssSyncService from '#services/epss_sync_service'
import env from '#start/env'
import type { ApplicationService } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'
import schedule from 'node-schedule'

export default class ScheduleProvider {
  constructor(protected app: ApplicationService) {}

  register() {}

  async boot() {}

  async start() {
    if (env.get('START_CRON') !== '1' || this.app.getEnvironment() !== 'web') {
      return
    }

    const cron = env.get('EPSS_CRON') || '0 16 * * *'
    logger.info('Scheduling EPSS sync with cron: %s', cron)

    schedule.scheduleJob(cron, async () => {
      logger.info('Starting scheduled EPSS sync')
      try {
        const result = await new EpssSyncService().sync()
        logger.info(
          'Scheduled EPSS sync finished: score_date=%s stored=%s',
          result.scoreDate,
          result.stored
        )
      } catch (error) {
        logger.error({ err: error }, 'Scheduled EPSS sync failed')
      }
    })
  }

  async ready() {}

  async shutdown() {}
}
