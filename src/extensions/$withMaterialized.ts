import { ColumnsSelection } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { Database, WithBuilder } from '#dialect/core'
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations'
import { injectWithSubqueryAddons } from './internal'

declare module '#dialect/core' {
  interface Database<
    TQueryResult = unknown,
    TFullSchema extends Record<string, unknown> = Record<string, unknown>,
    TRelations extends AnyRelations = AnyRelations,
    TTablesConfig extends TablesRelationalConfig = TablesRelationalConfig,
    TSchema extends V1.TablesRelationalConfig = V1.TablesRelationalConfig,
  > {
    /**
     * Similar to `$with()` but the CTE is materialized.
     *
     * Useful for ensuring a CTE is only executed once. The default behavior of
     * Postgres is to conditionally materialize the CTE based on certain
     * heuristics.
     *
     * @see https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION
     */
    $withMaterialized: WithBuilder
    /**
     * Similar to `$with()` but the CTE is **not** materialized.
     *
     * May improve performance by folding the CTE into its parent query. Only
     * allowed when the subquery is a `SELECT` with no use of volatile
     * functions.
     *
     * @see https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION
     */
    $withNotMaterialized: WithBuilder
  }
}

Database.prototype.$withMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: true,
  })
}

Database.prototype.$withNotMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: false,
  })
}
