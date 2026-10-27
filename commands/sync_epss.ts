import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import EpssSyncService from '#services/epss_sync_service'

export default class SyncEpss extends BaseCommand {
  static commandName = 'sync:epss'
  static description = 'Download the latest FIRST EPSS CSV and upsert scores into MySQL'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const service = new EpssSyncService()
    const result = await service.sync()
    this.logger.success(
      `Done. score_date=${result.scoreDate} stored=${result.stored} file=${result.sourceFile}`
    )
  }
}
