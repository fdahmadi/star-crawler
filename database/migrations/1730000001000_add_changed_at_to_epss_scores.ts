import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'epss_scores'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Null until epss/percentile actually change on a later sync.
      table.string('changed_at', 10).nullable().after('score_date')
      table.index(['changed_at'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['changed_at'])
      table.dropColumn('changed_at')
    })
  }
}
