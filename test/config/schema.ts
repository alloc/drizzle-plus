import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

export const foo = sqliteTable('foo', {
  id: integer().primaryKey(),
  name: text(),
  age: integer(),
  handle: text().unique(),
})

export const orderItems = sqliteTable(
  'order_items',
  {
    orderId: integer().notNull(),
    productId: integer().notNull(),
    quantity: integer().notNull(),
  },
  table => [
    primaryKey({
      columns: [table.orderId, table.productId],
    }),
  ]
)

export const userEmails = sqliteTable(
  'user_emails',
  {
    userId: integer().notNull(),
    email: text().notNull(),
    label: text(),
  },
  table => [unique().on(table.userId, table.email)]
)
