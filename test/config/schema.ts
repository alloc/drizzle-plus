import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: integer().primaryKey(),
  name: text(),
  age: integer(),
  handle: text().unique(),
})

export const orderItem = sqliteTable(
  'order_item',
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

export const userEmail = sqliteTable(
  'user_email',
  {
    userId: integer()
      .notNull()
      .references(() => user.id),
    email: text().notNull(),
    label: text(),
  },
  table => [unique('user_email_unique').on(table.userId, table.email)]
)
