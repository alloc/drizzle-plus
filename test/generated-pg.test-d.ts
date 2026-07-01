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
import 'drizzle-plus/pg/count'
import 'drizzle-plus/pg/create'
import 'drizzle-plus/pg/findManyAndCount'
import 'drizzle-plus/pg/findUnique'
import 'drizzle-plus/pg/fromSingle'
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/pg/withoutFrom'

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
  test('database helpers typecheck', () => {
    db.$select({ id: user.id, literal: 1 })
    db.$values([{ id: 1, name: 'Ada' }]).as('pg_values')
    db.$withValues('pg_with_values', [{ id: 1, name: 'Ada' }])
    db.$withRecursive('pg_recursive').as(self =>
      db.select({ id: self.id }).from(user)
    )
    db.$withMaterialized('pg_materialized').as(
      db.select({ id: user.id }).from(user)
    )
    db.$withNotMaterialized('pg_not_materialized').as(
      db.select({ id: user.id }).from(user)
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
    db.query.user.create({
      data: { id: 1, name: 'Ada' },
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
    db.select({ value: sql`1` }).fromSingle()
    db.select({ id: user.id }).from(user).as('pg_select')
    db.query.user.findFirst().as('pg_user')
  })
})
