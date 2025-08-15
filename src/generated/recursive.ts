// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { WithSubquery } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { PgDatabase } from 'drizzle-orm/pg-core'
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
     * A recursive CTE allows you to perform recursion within a query using the
     * `WITH RECURSIVE` syntax. A recursive CTE is often referred to as a
     * recursive query.
     */
    withRecursive: typeof this.with
  }
}

PgDatabase.prototype.withRecursive = function (...queries: WithSubquery[]) {
  if (queries.length > 0) {
    setWithSubqueryAddons(queries[0], { recursive: true })
  }
  return this.with(...queries)
}
