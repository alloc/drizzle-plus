import { defineRelations } from 'drizzle-orm'
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/mysql-proxy'
import 'drizzle-plus/mysql/$select'
import 'drizzle-plus/mysql/$values'
import 'drizzle-plus/mysql/$withRecursive'
import 'drizzle-plus/mysql/as'
import 'drizzle-plus/mysql/findUnique'
import 'drizzle-plus/mysql/fromSingle'
import 'drizzle-plus/mysql/updateMany'

const user = mysqlTable('user', {
  id: int().primaryKey(),
  name: varchar({ length: 255 }),
})
const schema = { user }
const relations = defineRelations(schema, () => ({ user: {} }))
const db = drizzle(async () => ({ rows: [] }), {
  schema,
  relations,
})

describe('generated MySQL helpers', () => {
  test('database helpers typecheck', () => {
    db.$select({ id: user.id, literal: 1 })
    db.$values([{ id: 1, name: 'Ada' }]).as('mysql_values')
    db.$withRecursive('mysql_recursive').as(self =>
      db.select({ id: self.id }).from(user)
    )
  })

  test('relational helpers typecheck', () => {
    db.query.user.findUnique({ where: { id: 1 } })
    db.query.user.updateMany({
      set: { name: 'Ada' },
      limit: 1,
    })
  })

  test('select-builder helpers typecheck', () => {
    db.select({ id: user.id }).fromSingle()
    db.query.user.findFirst().as('mysql_user')
  })
})
