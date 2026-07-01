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
import 'drizzle-plus/sqlite/count'
import 'drizzle-plus/sqlite/findManyAndCount'
import 'drizzle-plus/sqlite/findUnique'
import 'drizzle-plus/sqlite/fromSingle'
import 'drizzle-plus/sqlite/updateMany'
import 'drizzle-plus/sqlite/upsert'
import 'drizzle-plus/sqlite/withoutFrom'

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
  test('database helpers typecheck', () => {
    db.$select({ id: user.id, literal: 1 })
    db.$values([{ id: 1, name: 'Ada' }]).as('sqlite_values')
    db.$withValues('sqlite_with_values', [{ id: 1, name: 'Ada' }])
    db.$withRecursive('sqlite_recursive').as(self =>
      db.select({ id: self.id }).from(user)
    )
  })

  test('relational helpers typecheck', () => {
    db.query.user.$cursor({ id: 'asc' }, { id: 1 })
    db.query.user.$findMany({ where: { id: 1 } })
    db.query.user.count({ id: 1 })
    db.query.user.findManyAndCount({ where: { id: 1 } })
    db.query.user.findUnique({ where: { id: 1 } })
    db.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
      returning: { id: true },
    })
    db.query.user.upsert({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
  })

  test('select-builder helpers typecheck', () => {
    user.$without('name')
    db.select({ id: user.id }).fromSingle()
    db.select({ id: user.id }).withoutFrom()
    db.select({ id: user.id }).from(user).as('sqlite_select')
    db.query.user.findFirst().as('sqlite_user')
  })
})
