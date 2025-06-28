import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const foo = sqliteTable('foo', {
  id: integer().primaryKey(),
  name: text(),
  age: integer(),
})
