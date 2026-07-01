import { defineRelations, sql } from 'drizzle-orm'
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle as mysqlDrizzle } from 'drizzle-orm/mysql-proxy'
import {
  integer as pgInteger,
  pgTable,
  text as pgText,
} from 'drizzle-orm/pg-core'
import { drizzle as pgDrizzle } from 'drizzle-orm/pg-proxy'
import {
  integer as sqliteInteger,
  sqliteTable,
  text as sqliteText,
} from 'drizzle-orm/sqlite-core'
import { drizzle as sqliteDrizzle } from 'drizzle-orm/sqlite-proxy'
import 'drizzle-plus/mysql/$select'
import 'drizzle-plus/mysql/$values'
import 'drizzle-plus/mysql/$withRecursive'
import 'drizzle-plus/mysql/as'
import 'drizzle-plus/mysql/findUnique'
import 'drizzle-plus/mysql/fromSingle'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/pg/$select'
import 'drizzle-plus/pg/$values'
import 'drizzle-plus/pg/$withMaterialized'
import 'drizzle-plus/pg/$withRecursive'
import 'drizzle-plus/pg/as'
import 'drizzle-plus/pg/create'
import 'drizzle-plus/pg/findUnique'
import 'drizzle-plus/pg/fromSingle'
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/sqlite/$select'
import 'drizzle-plus/sqlite/$values'
import 'drizzle-plus/sqlite/$withRecursive'
import 'drizzle-plus/sqlite/as'
import 'drizzle-plus/sqlite/findUnique'
import 'drizzle-plus/sqlite/fromSingle'
import 'drizzle-plus/sqlite/updateMany'
import 'drizzle-plus/sqlite/upsert'

const pgUser = pgTable('user', {
  id: pgInteger().primaryKey(),
  name: pgText(),
})
const pgSchema = { user: pgUser }
const pgRelations = defineRelations(pgSchema, () => ({ user: {} }))
const pgDb = pgDrizzle(async () => ({ rows: [] }), {
  schema: pgSchema,
  relations: pgRelations,
})

const mysqlUser = mysqlTable('user', {
  id: int().primaryKey(),
  name: varchar({ length: 255 }),
})
const mysqlSchema = { user: mysqlUser }
const mysqlRelations = defineRelations(mysqlSchema, () => ({ user: {} }))
const mysqlDb = mysqlDrizzle(async () => ({ rows: [] }), {
  schema: mysqlSchema,
  relations: mysqlRelations,
})

const sqliteUser = sqliteTable('user', {
  id: sqliteInteger().primaryKey(),
  name: sqliteText(),
})
const sqliteSchema = { user: sqliteUser }
const sqliteRelations = defineRelations(sqliteSchema, () => ({ user: {} }))
const sqliteDb = sqliteDrizzle(async () => ({ rows: [] }), {
  schema: sqliteSchema,
  relations: sqliteRelations,
})

describe('generated dialect database helpers', () => {
  test('values and CTE helpers typecheck for every generated dialect', () => {
    pgDb.$select({ id: pgUser.id, literal: 1 })
    pgDb.$values([{ id: 1, name: 'Ada' }]).as('pg_values')
    pgDb
      .$withRecursive('pg_recursive')
      .as(self => pgDb.select({ id: self.id }).from(pgUser))
    pgDb
      .$withMaterialized('pg_materialized')
      .as(pgDb.select({ id: pgUser.id }).from(pgUser))

    mysqlDb.$select({ id: mysqlUser.id, literal: 1 })
    mysqlDb.$values([{ id: 1, name: 'Ada' }]).as('mysql_values')
    mysqlDb
      .$withRecursive('mysql_recursive')
      .as(self => mysqlDb.select({ id: self.id }).from(mysqlUser))

    sqliteDb.$select({ id: sqliteUser.id, literal: 1 })
    sqliteDb.$values([{ id: 1, name: 'Ada' }]).as('sqlite_values')
    sqliteDb
      .$withRecursive('sqlite_recursive')
      .as(self => sqliteDb.select({ id: self.id }).from(sqliteUser))
  })
})

describe('generated dialect relational helpers', () => {
  test('shared relational helpers typecheck for every generated dialect', () => {
    pgDb.query.user.findUnique({ where: { id: 1 } })
    pgDb.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
      returning: { id: true },
    })

    mysqlDb.query.user.findUnique({ where: { id: 1 } })
    mysqlDb.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
    })

    sqliteDb.query.user.findUnique({ where: { id: 1 } })
    sqliteDb.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
      returning: { id: true },
    })
  })

  test('dialect-specific relational helpers typecheck where supported', () => {
    pgDb.query.user.create({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
    pgDb.query.user.upsert({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })

    sqliteDb.query.user.upsert({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
  })
})

describe('generated dialect select helpers', () => {
  test('select-builder helpers typecheck for every generated dialect', () => {
    pgDb.select({ id: pgUser.id }).fromSingle()
    mysqlDb.select({ id: mysqlUser.id }).fromSingle()
    sqliteDb.select({ id: sqliteUser.id }).fromSingle()

    pgDb.query.user.findFirst().as('pg_user')
    mysqlDb.query.user.findFirst().as('mysql_user')
    sqliteDb.query.user.findFirst().as('sqlite_user')
  })

  test('SQL selections typecheck with select-builder helpers', () => {
    pgDb.select({ value: sql`1` }).fromSingle()
  })
})
