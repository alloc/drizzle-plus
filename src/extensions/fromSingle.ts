// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { DrizzleError, sql } from 'drizzle-orm'
import {
  PgSelectBuilder,
  PgSelectQueryBuilderBase,
  PgSelectQueryBuilderHKT,
  SelectedFields,
} from 'drizzle-orm/pg-core'

declare module 'drizzle-orm/pg-core' {
  interface PgSelectBuilder<
    TSelection extends SelectedFields | undefined,
    // mysql-insert: TPreparedQueryHKT extends PreparedQueryHKTBase,
    // sqlite-insert: TResultType extends 'sync' | 'async', TRunResult,
    TBuilderMode extends 'db' | 'qb',
  > {
    /**
     * Creates a single-row placeholder base that can be left-joined with other
     * subqueries. This ensures the final result set always contains exactly one
     * row, even if all joined subqueries are empty.
     *
     * This is sometimes called the 'dummy row subquery' pattern or the
     * 'single-row placeholder' pattern.
     *
     * Use this when you need guaranteed single-row results from queries with
     * optional left joins, such as aggregate queries that should return one row
     * even with no matching data.
     *
     * Equivalent to calling `.from(sql.raw('(SELECT 1) AS "placeholder"'))`.
     */
    fromSingle(): TSelection extends SelectedFields
      ? PgSelectQueryBuilderBase<
          PgSelectQueryBuilderHKT,
          undefined,
          // sqlite-insert: TResultType, TRunResult,
          TSelection,
          'partial'
          // mysql-insert: ,TPreparedQueryHKT
        >
      : never
  }
}

PgSelectBuilder.prototype.fromSingle = function (): any {
  const { fields }: { fields: SelectedFields | undefined } = this as any
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return this.from(sql.raw('(select 1) as "placeholder"'))
}
