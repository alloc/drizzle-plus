// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { ColumnsSelection, WithSubquery } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { PgDatabase, WithSubqueryWithSelection } from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations'
import { setWithSubqueryAddons } from './internal'

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
     * Use this instead of `$with()` to create a subquery that can reference
     * itself. If TypeScript is failing, it may help to declare the selection
     * type explicitly at the `.as<{…}>()` call.
     */
    $withRecursive<TAlias extends string>(
      alias: TAlias
    ): {
      as<TSelection extends ColumnsSelection>(
        callback: (
          self: WithSubqueryWithSelection<NoInfer<TSelection>, TAlias>
        ) => TypedQueryBuilder<TSelection>
      ): WithSubqueryWithSelection<TSelection, TAlias>
    }
    /**
     * A recursive CTE allows you to perform recursion within a query using the
     * `WITH RECURSIVE` syntax. A recursive CTE is often referred to as a
     * recursive query.
     */
    withRecursive: PgDatabase<
      TQueryResult,
      TFullSchema,
      TRelations,
      TTablesConfig,
      TSchema
    >['with']
  }
}

PgDatabase.prototype.withRecursive = function (...queries: WithSubquery[]) {
  if (queries.length > 0) {
    setWithSubqueryAddons(queries[0], { recursive: true })
  }
  return this.with(...queries)
}
