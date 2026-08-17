import { defineRelations } from 'drizzle-orm'
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/mysql-proxy'
import 'drizzle-plus/mysql/$cursor'
import 'drizzle-plus/mysql/$findMany'
import 'drizzle-plus/mysql/$select'
import 'drizzle-plus/mysql/$values'
import 'drizzle-plus/mysql/$withRecursive'
import 'drizzle-plus/mysql/$without'
import 'drizzle-plus/mysql/as'
import type { MySqlRelationalSubquery } from 'drizzle-plus/mysql/as'
import 'drizzle-plus/mysql/count'
import 'drizzle-plus/mysql/findManyAndCount'
import 'drizzle-plus/mysql/findUnique'
import 'drizzle-plus/mysql/fromSingle'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/mysql/withoutFrom'
import type { MySqlSelectWithoutFrom } from 'drizzle-plus/mysql/withoutFrom'

const user = mysqlTable('user', {
  id: int().primaryKey(),
  name: varchar({ length: 255 }),
})
const schema = { user }
const relations = defineRelations(schema, () => ({ user: {} }))
const db = drizzle(async () => ({ rows: [] }), {
  relations,
})

describe('generated MySQL helpers', () => {
  test('public generated types stay dialect-specific', () => {
    expectTypeOf<MySqlRelationalSubquery<{ id: number }, 'mysql_user'>>()
      .toHaveProperty('id')
    expectTypeOf<
      MySqlSelectWithoutFrom<{ id: typeof user.id }>
    >().toHaveProperty('execute')
  })

  test('database helpers typecheck', () => {
    const selection = db.$select({ id: user.id, literal: 1 })
    expectTypeOf(selection).toHaveProperty('id')
    expectTypeOf(selection).toHaveProperty('literal')

    const values = db.$values([{ id: 1, name: 'Ada' }])
    expectTypeOf(values.getSQL()).not.toBeAny()

    const valuesSubquery = values.as('mysql_values')
    expectTypeOf(valuesSubquery).toHaveProperty('id')
    expectTypeOf(valuesSubquery).toHaveProperty('name')

    const withValues = db.$withValues('mysql_with_values', [
      { id: 1, name: 'Ada' },
    ])
    expectTypeOf(withValues).toHaveProperty('id')
    expectTypeOf(withValues).toHaveProperty('name')

    const recursive = db
      .$withRecursive('mysql_recursive')
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
    })
    expectTypeOf(updated).toEqualTypeOf<number>()
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
      .as('mysql_select')
    expectTypeOf(selectSubquery).toHaveProperty('id')

    const relationalSubquery = db.query.user.findFirst().as('mysql_user')
    expectTypeOf(relationalSubquery).toHaveProperty('id')
    expectTypeOf(relationalSubquery).toHaveProperty('name')
  })
})
