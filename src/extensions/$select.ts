import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { Database } from '#dialect/db'
import { toSelection } from 'drizzle-plus'
import { RawFieldsToSelection } from 'drizzle-plus/types'

declare module '#dialect/db' {
  interface Database<
    TQueryResult = unknown,
    TFullSchema extends Record<string, unknown> = Record<string, unknown>,
    TRelations extends AnyRelations = AnyRelations,
    TTablesConfig extends TablesRelationalConfig = TablesRelationalConfig,
    TSchema extends V1.TablesRelationalConfig = V1.TablesRelationalConfig,
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

Database.prototype.$select = <T extends Record<string, unknown>>(fields: T) =>
  toSelection(fields, { addAliases: true })
