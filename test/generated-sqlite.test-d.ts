import { defineRelations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import 'drizzle-plus/sqlite/$cursor'
import 'drizzle-plus/sqlite/$findMany'
import 'drizzle-plus/sqlite/$select'
import 'drizzle-plus/sqlite/$values'
import 'drizzle-plus/sqlite/$withRecursive'
import 'drizzle-plus/sqlite/$without'
import 'drizzle-plus/sqlite/as'
import type { SQLiteRelationalSubquery } from 'drizzle-plus/sqlite/as'
import 'drizzle-plus/sqlite/count'
import 'drizzle-plus/sqlite/findManyAndCount'
import 'drizzle-plus/sqlite/findUnique'
import 'drizzle-plus/sqlite/fromSingle'
import 'drizzle-plus/sqlite/updateMany'
import 'drizzle-plus/sqlite/upsert'
import type { SQLiteUpsertSelectQuery } from 'drizzle-plus/sqlite/upsert'
import 'drizzle-plus/sqlite/withoutFrom'
import type { SQLiteSelectWithoutFrom } from 'drizzle-plus/sqlite/withoutFrom'

const user = sqliteTable('user', {
  id: integer().primaryKey(),
  name: text(),
})
const schema = { user }
const relations = defineRelations(schema, () => ({ user: {} }))
const db = drizzle(async () => ({ rows: [] }), {
  schema,
  relations,
})

describe('generated SQLite helpers', () => {
  test('public generated types stay dialect-specific', () => {
    expectTypeOf<SQLiteRelationalSubquery<{ id: number }, 'sqlite_user'>>()
      .toHaveProperty('id')
    expectTypeOf<
      SQLiteSelectWithoutFrom<{ id: typeof user.id }>
    >().toHaveProperty('execute')
    expectTypeOf<SQLiteUpsertSelectQuery<typeof user>>().not.toBeNever()
  })

  test('database helpers typecheck', () => {
    const selection = db.$select({ id: user.id, literal: 1 })
    expectTypeOf(selection).toHaveProperty('id')
    expectTypeOf(selection).toHaveProperty('literal')

    const values = db.$values([{ id: 1, name: 'Ada' }])
    expectTypeOf(values.getSQL()).not.toBeAny()

    const valuesSubquery = values.as('sqlite_values')
    expectTypeOf(valuesSubquery).toHaveProperty('id')
    expectTypeOf(valuesSubquery).toHaveProperty('name')

    const withValues = db.$withValues('sqlite_with_values', [
      { id: 1, name: 'Ada' },
    ])
    expectTypeOf(withValues).toHaveProperty('id')
    expectTypeOf(withValues).toHaveProperty('name')

    const recursive = db
      .$withRecursive('sqlite_recursive')
      .as(self => db.select({ id: self.id }).from(user))
    expectTypeOf(recursive).toHaveProperty('id')
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

    const selectSubquery = db
      .select({ id: user.id })
      .from(user)
      .as('sqlite_select')
    expectTypeOf(selectSubquery).toHaveProperty('id')

    const relationalSubquery = db.query.user.findFirst().as('sqlite_user')
    expectTypeOf(relationalSubquery).toHaveProperty('id')
    expectTypeOf(relationalSubquery).toHaveProperty('name')
  })
})
