// @ts-nocheck
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { SQLiteAsyncDatabase as Database } from 'drizzle-orm/sqlite-core/async/db'
import { toSelection } from 'drizzle-plus'
import { RawFieldsToSelection } from 'drizzle-plus/types'

declare module 'drizzle-orm/sqlite-core/async/db' {
  interface SQLiteAsyncDatabase<
    TResultKind extends 'sync' | 'async',
    TRunResult,
    TRelations extends AnyRelations,
  > {
    /**
     * Create a "selection" object compatible with `db.select` from a plain
     * object containing almost any value.
     *
     * - `undefined` values are ignored
     * - strings, dates, and JSON values are parameterized
     * - numbers, booleans, and `null` are emitted as SQL literals
     * - `Date` values are treated as ISO strings
     * - subqueries and `SQL` objects are preserved
     * - everything else is coerced to a JSON string
     */
    $select<TFields extends Record<string, unknown>>(
      fields: TFields
    ): RawFieldsToSelection<TFields>
  }
}

Database.prototype.$select = <T extends Record<string, unknown>>(fields: T) =>
  toSelection(fields, { addAliases: true })
