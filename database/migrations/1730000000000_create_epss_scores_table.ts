import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'epss_scores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('cve', 32).notNullable().unique()
      table.decimal('epss', 12, 9).notNullable()
      table.decimal('percentile', 12, 9).notNullable()
      table.string('score_date', 10).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.index(['score_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
