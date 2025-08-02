// mysql-insert: import { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import {
  AnyRelations,
  DrizzleError,
  is,
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
import { isDate } from 'radashi'
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
      selection[key] = sqlNull.as(key)
      continue
    }
    const type = typeof value
    if (type === 'object' && (is(value, PgColumn) || is(value, SQL.Aliased))) {
      selection[key] = value
      continue
    }
    if (type === 'function') {
      throw new DrizzleError({
        message: 'Function values are not allowed in selection',
      })
    }

    const sqlValue: SQL =
      type === 'number' || type === 'boolean'
        ? sql.raw(String(value))
        : type !== 'object'
          ? new SQL([value as any])
          : is(value, SQL)
            ? value
            : is(value, QueryPromise) || is(value, TypedQueryBuilder<any>)
              ? getSQL(value)
              : isDate(value)
                ? sql.raw(`'${value.toISOString()}'`)
                : new SQL([JSON.stringify(value) as any])

    selection[key] = sqlValue.as(key)
  }
  return selection as any
}
