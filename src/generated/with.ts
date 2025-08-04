// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { ColumnsSelection } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { PgDatabase, WithBuilder } from 'drizzle-orm/pg-core'
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations'
import { injectWithSubqueryAddons } from './internal'

declare module 'drizzle-orm/pg-core' {
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

PgDatabase.prototype.$withMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: true,
  })
}

PgDatabase.prototype.$withNotMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: false,
  })
}
