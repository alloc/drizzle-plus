import { defineRelations, sql } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/pg-proxy'
import 'drizzle-plus/pg/$cursor'
import 'drizzle-plus/pg/$findMany'
import 'drizzle-plus/pg/$select'
import 'drizzle-plus/pg/$values'
import 'drizzle-plus/pg/$withMaterialized'
import 'drizzle-plus/pg/$withRecursive'
import 'drizzle-plus/pg/$without'
import 'drizzle-plus/pg/as'
import type { PgRelationalSubquery } from 'drizzle-plus/pg/as'
import 'drizzle-plus/pg/count'
import 'drizzle-plus/pg/create'
import 'drizzle-plus/pg/findManyAndCount'
import 'drizzle-plus/pg/findUnique'
import 'drizzle-plus/pg/fromSingle'
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/pg/upsert'
import type { PgUpsertSelectQuery } from 'drizzle-plus/pg/upsert'
import 'drizzle-plus/pg/withoutFrom'
import type { PgSelectWithoutFrom } from 'drizzle-plus/pg/withoutFrom'

const user = pgTable('user', {
  id: integer().primaryKey(),
  name: text(),
})
const schema = { user }
const relations = defineRelations(schema, () => ({ user: {} }))
const db = drizzle(async () => ({ rows: [] }), {
  schema,
  relations,
})

describe('generated PostgreSQL helpers', () => {
  test('public generated types stay dialect-specific', () => {
    expectTypeOf<PgRelationalSubquery<{ id: number }, 'pg_user'>>()
      .toHaveProperty('id')
    expectTypeOf<PgSelectWithoutFrom<{ id: typeof user.id }>>().toHaveProperty(
      'execute'
    )
    expectTypeOf<PgUpsertSelectQuery<typeof user>>().not.toBeNever()
  })

  test('database helpers typecheck', () => {
    const selection = db.$select({ id: user.id, literal: 1 })
    expectTypeOf(selection).toHaveProperty('id')
    expectTypeOf(selection).toHaveProperty('literal')

    const values = db.$values([{ id: 1, name: 'Ada' }])
    expectTypeOf(values.getSQL()).not.toBeAny()

    const valuesSubquery = values.as('pg_values')
    expectTypeOf(valuesSubquery).toHaveProperty('id')
    expectTypeOf(valuesSubquery).toHaveProperty('name')

    const withValues = db.$withValues('pg_with_values', [
      { id: 1, name: 'Ada' },
    ])
    expectTypeOf(withValues).toHaveProperty('id')
    expectTypeOf(withValues).toHaveProperty('name')

    const recursive = db
      .$withRecursive('pg_recursive')
      .as(self => db.select({ id: self.id }).from(user))
    expectTypeOf(recursive).toHaveProperty('id')

    const materialized = db
      .$withMaterialized('pg_materialized')
      .as(db.select({ id: user.id }).from(user))
    expectTypeOf(materialized).toHaveProperty('id')

    const notMaterialized = db
      .$withNotMaterialized('pg_not_materialized')
      .as(db.select({ id: user.id }).from(user))
    expectTypeOf(notMaterialized).toHaveProperty('id')
  })

  test('relational helpers typecheck', async () => {
    const cursor = db.query.user.$cursor({ id: 'asc' }, { id: 1 })
    expectTypeOf(cursor).toHaveProperty('orderBy')
    expectTypeOf(cursor).toHaveProperty('where')

    const findManyConfig = db.query.user.$findMany({ where: { id: 1 } })
    expectTypeOf(findManyConfig).toHaveProperty('where')

    const count = await db.query.user.count({ id: 1 })
    expectTypeOf(count).toEqualTypeOf<number>()

    const foundManyAndCount = await db.query.user.findManyAndCount({
      columns: { id: true },
      where: { id: 1 },
    })
    expectTypeOf(foundManyAndCount).toEqualTypeOf<{
      data: { id: number }[]
      count: number
    }>()

    const foundUnique = await db.query.user.findUnique({
      columns: { id: true },
      where: { id: 1 },
    })
    expectTypeOf(foundUnique).toEqualTypeOf<{ id: number } | undefined>()

    const updated = await db.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
      returning: { id: true },
    })
    expectTypeOf(updated).toEqualTypeOf<{ id: number }[]>()

    const created = await db.query.user.create({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
    expectTypeOf(created).toEqualTypeOf<{ id: number }>()

    const upserted = await db.query.user.upsert({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
    expectTypeOf(upserted).toEqualTypeOf<{ id: number }>()
  })

  test('select-builder helpers typecheck', async () => {
    const columnsWithoutName = user.$without('name')
    expectTypeOf(columnsWithoutName).toHaveProperty('id')
    expectTypeOf(columnsWithoutName).not.toHaveProperty('name')

    const fromSingleQuery = db.select({ id: user.id }).fromSingle()
    expectTypeOf(fromSingleQuery).toHaveProperty('getSQL')

    const withoutFromQuery = db.select({ id: user.id }).withoutFrom()
    expectTypeOf(withoutFromQuery).toHaveProperty('getSQL')

    const sqlQuery = db.select({ value: sql`1` }).fromSingle()
    expectTypeOf(sqlQuery).toHaveProperty('getSQL')

    const selectSubquery = db.select({ id: user.id }).from(user).as('pg_select')
    expectTypeOf(selectSubquery).toHaveProperty('id')

    const relationalSubquery = db.query.user.findFirst().as('pg_user')
    expectTypeOf(relationalSubquery).toHaveProperty('id')
    expectTypeOf(relationalSubquery).toHaveProperty('name')
  })
})
