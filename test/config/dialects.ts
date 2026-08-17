import { defineRelations } from 'drizzle-orm'
import { drizzle as mysqlDrizzle } from 'drizzle-orm/mysql-proxy'
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle as pgDrizzle } from 'drizzle-orm/pg-proxy'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { drizzle as sqliteDrizzle } from 'drizzle-orm/sqlite-proxy'
import {
  integer as sqliteInteger,
  sqliteTable,
  text as sqliteText,
} from 'drizzle-orm/sqlite-core'

export const pgUser = pgTable('user', {
  id: integer().primaryKey(),
  name: text(),
  age: integer(),
  handle: text().unique(),
})

export const mysqlUser = mysqlTable('user', {
  id: int().primaryKey(),
  name: varchar({ length: 255 }),
  age: int(),
  handle: varchar({ length: 255 }).unique(),
})

export const sqliteUser = sqliteTable('user', {
  id: sqliteInteger().primaryKey(),
  name: sqliteText(),
  age: sqliteInteger(),
  handle: sqliteText().unique(),
})

const pgSchema = { user: pgUser }
const mysqlSchema = { user: mysqlUser }
const sqliteSchema = { user: sqliteUser }

const pgRelations = defineRelations(pgSchema, () => ({ user: {} }))
const mysqlRelations = defineRelations(mysqlSchema, () => ({ user: {} }))
const sqliteRelations = defineRelations(sqliteSchema, () => ({ user: {} }))

export const pgDb = pgDrizzle(async () => ({ rows: [] }), {
  relations: pgRelations,
})

export const mysqlDb = mysqlDrizzle(async () => ({ rows: [] }), {
  relations: mysqlRelations,
})

export const sqliteDb = sqliteDrizzle(async () => ({ rows: [] }), {
  relations: sqliteRelations,
})
