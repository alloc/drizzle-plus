import { sql } from 'drizzle-orm'
import { toSelection } from 'drizzle-plus'
import { getDialect } from 'drizzle-plus/utils'
import 'drizzle-plus/pg/$values'
import 'drizzle-plus/pg/$withMaterialized'
import 'drizzle-plus/pg/$withRecursive'
import 'drizzle-plus/pg/$without'
import 'drizzle-plus/pg/as'
import 'drizzle-plus/pg/fromSingle'
import 'drizzle-plus/pg/withoutFrom'
import 'drizzle-plus/sqlite/$select'
import 'drizzle-plus/sqlite/$values'
import 'drizzle-plus/sqlite/$withRecursive'
import 'drizzle-plus/sqlite/$without'
import 'drizzle-plus/sqlite/as'
import 'drizzle-plus/sqlite/fromSingle'
import 'drizzle-plus/sqlite/withoutFrom'
import { db } from './config/client'
import { pgDb, pgUser } from './config/dialects'
import { user } from './config/schema'

describe('$select and toSelection', () => {
  test('turn plain values into a selectable, aliased object', () => {
    const selection = db.$select({
      id: user.id,
      label: 'Ada',
      active: true,
      metadata: { source: 'test' },
      ignored: undefined,
    })

    const query = db.select(selection).from(user)
    const result = query.toSQL()

    expect(result.sql).toContain('select "id"')
    expect(result.sql).toContain('as "label"')
    expect(result.sql).toContain('as "active"')
    expect(result.sql).toContain('as "metadata"')
    expect(result.sql).not.toContain('ignored')
    expect(result.params).toContain('Ada')
    expect(result.params).toContain('{"source":"test"}')
  })

  test('rejects function values and supports dates', () => {
    expect(() =>
      toSelection({ invalid: (() => 'nope') as unknown as string })
    ).toThrow('Function values are not allowed in a selection')

    const selection = toSelection({
      createdAt: new Date('2020-01-02T03:04:05.000Z'),
    })
    const query = db.select(selection).from(user)
    expect(query.toSQL().params).toContain('2020-01-02T03:04:05.000Z')
  })
})

describe('$values', () => {
  test('builds an aliased VALUES relation and CTE', () => {
    const values = db.$values([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ])
    const aliased = values.as('input_users')
    const query = db
      .select({ id: aliased.id, name: aliased.name })
      .from(aliased)

    expect(query.toSQL()).toMatchObject({
      params: [1, 'Ada', 2, 'Grace'],
      sql: expect.stringContaining('values'),
    })

    const cte = db.$withValues('input_users', [{ id: 1 }, { id: 2 }])
    const cteQuery = db.with(cte).select({ id: cte.id }).from(cte)
    expect(cteQuery.toSQL().sql).toContain('with "input_users"')
  })

  test('validates rows and supports explicit SQL typings', () => {
    expect(() => db.$values([])).toThrow('No rows provided')
    expect(() => db.$values([{ id: undefined }]).getSQL()).toThrow(
      'Undefined values are not allowed'
    )

    const typed = db.$values([{ id: '1' }], { id: 'integer' })
    const typedSql = getDialect(
      db.select({ id: user.id }).from(user)
    ).sqlToQuery(typed.getSQL())
    expect(typedSql.sql).toContain('cast(? as integer)')
  })
})

describe('aliases and column selection', () => {
  test('aliases select and relational queries with decodable fields', () => {
    const selectAlias = db
      .select({ id: user.id })
      .from(user)
      .as('selected_users')
    const selected = db.select({ id: selectAlias.id }).from(selectAlias)
    expect(selected.toSQL().sql).toContain('selected_users')

    const relationAlias = db.query.user
      .findFirst({ columns: { id: true } })
      .as('one_user')
    const relational = db.select({ id: relationAlias.id }).from(relationAlias)
    expect(relational.toSQL().sql).toContain('one_user')
  })

  test('requires a selection before aliasing', () => {
    expect(() => (db.select() as any).as('missing_fields')).toThrow(
      'Cannot alias a select query without a selection'
    )

    expect(Object.keys(user.$without('handle'))).toEqual(['id', 'name', 'age'])
  })
})

describe('CTE and select bases', () => {
  test('builds recursive CTEs', () => {
    const tree = db
      .$withRecursive('user_tree')
      .as(self => db.select({ id: self.id }).from(user))
    const query = db.with(tree).select({ id: tree.id }).from(tree)
    expect(query.toSQL().sql).toContain('with recursive "user_tree"')
  })

  test('builds PostgreSQL materialization controls', () => {
    const materialized = pgDb
      .$withMaterialized('active_users')
      .as(pgDb.select({ id: pgUser.id }).from(pgUser))
    const notMaterialized = pgDb
      .$withNotMaterialized('inline_users')
      .as(pgDb.select({ id: pgUser.id }).from(pgUser))

    expect(
      pgDb.with(materialized).select().from(materialized).toSQL().sql
    ).toContain('as materialized')
    expect(
      pgDb.with(notMaterialized).select().from(notMaterialized).toSQL().sql
    ).toContain('as not materialized')
  })

  test('supports single-row and no-FROM selects', async () => {
    const fromSingle = db.select({ answer: sql<number>`1 + 1` }).fromSingle()
    expect(fromSingle.toSQL().sql).toContain('from (select 1) as "placeholder"')
    await expect(fromSingle).resolves.toEqual([{ answer: 2 }])

    const withoutFrom = db.select({ answer: sql<number>`1 + 1` }).withoutFrom()
    expect(withoutFrom.toSQL().sql).toContain('select 1 + 1')
    await expect(withoutFrom).resolves.toEqual([{ answer: 2 }])
  })
})
