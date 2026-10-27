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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
