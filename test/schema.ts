import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const foo = sqliteTable('foo', {
  id: integer().primaryKey(),
})
