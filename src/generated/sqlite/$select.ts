// @ts-nocheck
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core/db'
import { toSelection } from 'drizzle-plus'
import { RawFieldsToSelection } from 'drizzle-plus/types'

declare module 'drizzle-orm/sqlite-core/db' {
  interface BaseSQLiteDatabase<
    TResultKind extends 'sync' | 'async',
    TRunResult,
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

BaseSQLiteDatabase.prototype.$select = <T extends Record<string, unknown>>(fields: T) =>
  toSelection(fields, { addAliases: true })
