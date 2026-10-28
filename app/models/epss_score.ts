import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class EpssScore extends BaseModel {
  static table = 'epss_scores'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cve: string

  @column()
  declare epss: number

  @column()
  declare percentile: number

  @column()
  declare scoreDate: string

  /** Last FIRST score_date when epss/percentile actually changed; null until first change. */
  @column()
  declare changedAt: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
