// mysql-insert: import { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import {
  AnyRelations,
  DrizzleError,
  QueryPromise,
  sql,
  SQL,
  TablesRelationalConfig,
} from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { PgColumn, SelectedFields } from 'drizzle-orm/pg-core'
import { PgDatabase } from 'drizzle-orm/pg-core/db'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { RawFieldsToSelection } from 'drizzle-plus/types'
import { getSQL } from 'drizzle-plus/utils'
import { sqlNull } from './internal'

declare module 'drizzle-orm/pg-core/db' {
  interface PgDatabase<
    // sqlite-insert: TResultKind extends 'sync' | 'async',
    // sqlite-insert: TRunResult,
    // sqlite-remove-next-line
    TQueryResult extends import('drizzle-orm/pg-core').PgQueryResultHKT,
    // mysql-insert: TPreparedQueryHKT extends PreparedQueryHKTBase,
    TFullSchema extends Record<string, unknown>,
    TRelations extends AnyRelations,
    TTablesConfig extends TablesRelationalConfig,
    TSchema extends V1.TablesRelationalConfig,
  > {
    /**
     * Create a "selection" object compatible with `db.select` from a plain
     * object containing almost any value.
     *
     * - `undefined` values are ignored
     * - primitive values (including `null`) are wrapped with `sql` template
     * - `Date` values are treated as ISO strings
     * - subqueries and `SQL` objects are preserved
     * - everything else is coerced to a JSON string
     */
    $select<TFields extends Record<string, unknown>>(
      fields: TFields
    ): RawFieldsToSelection<TFields>
  }
}

PgDatabase.prototype.$select = function (fields: Record<string, unknown>) {
  const selection: SelectedFields = {}
  for (const key in fields) {
    const value = fields[key]
    if (value === undefined) {
      continue
    }
    if (value === null) {
      selection[key] = sqlNull
      continue
    }
    const type = typeof value
    if (type !== 'object') {
      if (type === 'function') {
        throw new DrizzleError({
          message: 'Function values are not allowed in selection',
        })
      }
      selection[key] =
        type === 'number' || type === 'boolean'
          ? sql.raw(String(value))
          : sql`${value}`
    } else if (
      value instanceof SQL ||
      value instanceof PgColumn ||
      value instanceof SQL.Aliased
    ) {
      selection[key] = value
    } else if (
      value instanceof QueryPromise ||
      value instanceof TypedQueryBuilder
    ) {
      selection[key] = getSQL(value)
    } else if (value instanceof Date) {
      selection[key] = sql.raw(value.toISOString())
    } else {
      selection[key] = sql`${JSON.stringify(value)}`
    }
  }
  return selection as any
}
