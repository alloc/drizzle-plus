import { defineRelations, sql } from 'drizzle-orm'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/pg-proxy'
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
    db.$withRecursive('pg_recursive').as(self =>
      db.select({ id: self.id }).from(user)
    )
    db.$withMaterialized('pg_materialized').as(
      db.select({ id: user.id }).from(user)
    )
  })

  test('relational helpers typecheck', () => {
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
    db.select({ id: user.id }).fromSingle()
    db.select({ value: sql`1` }).fromSingle()
    db.query.user.findFirst().as('pg_user')
  })
})
