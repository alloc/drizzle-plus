import { sql, type SQL } from 'drizzle-orm'
import type {
  InferFindFirstArgs,
  InferFindManyArgs,
  InferOrderBy,
  InferRelations,
  InferRelationsFilter,
  QueryToResult,
  QueryToSQL,
  RawFieldsToSelection,
  ReturningClause,
  ReturningResultFields,
  SQLResult,
} from 'drizzle-plus/types'
import 'drizzle-plus/mysql/$withRecursive'
import 'drizzle-plus/mysql/orThrow'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/pg/$withMaterialized'
import 'drizzle-plus/pg/as'
import 'drizzle-plus/pg/orThrow'
import 'drizzle-plus/sqlite/$withRecursive'
import 'drizzle-plus/sqlite/as'
import 'drizzle-plus/sqlite/orThrow'
import 'drizzle-plus/sqlite/updateMany'
import 'drizzle-plus/sqlite/upsert'
import { db } from './config/client'
import { mysqlDb, pgDb, pgUser, sqliteDb, sqliteUser } from './config/dialects'
import * as schema from './config/schema'

describe('feature type contracts', () => {
  test('query arguments and result inference', () => {
    const listQuery = db.query.user.findMany({
      columns: { id: true },
      where: { id: 1 },
    })
    const firstQuery = db.query.user.findFirst({
      columns: { id: true },
      where: { id: 1 },
    })

    expectTypeOf<InferRelationsFilter<typeof db.query.user>>().toMatchTypeOf<{
      id?: unknown
    }>()
    expectTypeOf<InferRelations<typeof db.query.user>>().toMatchTypeOf<object>()
    expectTypeOf<
      Exclude<InferOrderBy<typeof db.query.user>, Function>
    >().toMatchTypeOf<{
      id?: 'asc' | 'desc'
    }>()
    expectTypeOf<InferFindManyArgs<typeof db.query.user>>().toMatchTypeOf<{
      columns?: object
      where?: object
    }>()
    expectTypeOf<InferFindFirstArgs<typeof db.query.user>>().toMatchTypeOf<{
      columns?: object
      where?: object
    }>()

    expectTypeOf<QueryToResult<typeof listQuery>>().toEqualTypeOf<
      { id: number }[]
    >()
    expectTypeOf<QueryToResult<typeof firstQuery>>().toEqualTypeOf<{
      id: number
    } | null>()
    expectTypeOf<QueryToSQL<typeof listQuery>>().toMatchTypeOf<
      SQL<{ id: number }[]>
    >()
  })

  test('returning, raw selection, and SQL expression types', () => {
    const rawSelection = {} as RawFieldsToSelection<{
      label: string
      count: number
      metadata: { source: string }
    }>
    expectTypeOf(rawSelection).toHaveProperty('label')
    expectTypeOf(rawSelection).toHaveProperty('count')
    expectTypeOf(rawSelection).toHaveProperty('metadata')

    expectTypeOf<SQLResult<typeof schema.user.id>>().toEqualTypeOf<number>()
    expectTypeOf<SQLResult<typeof schema.user.name>>().toEqualTypeOf<
      string | null
    >()

    type UserReturning = ReturningClause<typeof schema.user>
    expectTypeOf<
      ReturningResultFields<'many', typeof schema.user, { id: true }>
    >().toEqualTypeOf<{ id: number }[]>()
    expectTypeOf<UserReturning>().toMatchTypeOf<Record<string, unknown>>()

    const expression = sql<number>`1`
    expectTypeOf(expression).toMatchTypeOf<SQL<number>>()
  })

  test('dialect-specific recursive and materialized helpers', () => {
    const pgRecursive = pgDb
      .$withRecursive('pg_tree')
      .as(self => pgDb.select({ id: self.id }).from(pgUser))
    expectTypeOf(pgRecursive).toHaveProperty('id')

    const sqliteRecursive = sqliteDb
      .$withRecursive('sqlite_tree')
      .as(self => sqliteDb.select({ id: self.id }).from(sqliteUser))
    expectTypeOf(sqliteRecursive).toHaveProperty('id')
  })

  test('unsupported dialect helpers are rejected', () => {
    // @ts-expect-error MySQL does not generate create().
    mysqlDb.query.user.create({ data: { id: 1 } })
    // @ts-expect-error MySQL does not generate upsert().
    mysqlDb.query.user.upsert({ data: { id: 1 } })
    // @ts-expect-error SQLite does not generate create().
    sqliteDb.query.user.create({ data: { id: 1 } })
    // @ts-expect-error Materialized CTE helpers are PostgreSQL-only.
    mysqlDb.$withMaterialized('mysql_cte')
    // @ts-expect-error Materialized CTE helpers are PostgreSQL-only.
    sqliteDb.$withMaterialized('sqlite_cte')
    mysqlDb.query.user.updateMany({
      set: { name: 'Ada' },
      // @ts-expect-error MySQL updateMany cannot accept returning.
      returning: { id: true },
    })
  })
})
