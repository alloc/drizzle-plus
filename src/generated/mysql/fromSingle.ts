// @ts-nocheck
import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { DrizzleError, sql } from 'drizzle-orm'
import {
  MySqlSelectBuilder,
  MySqlSelectQueryBuilderBase,
  MySqlSelectQueryBuilderHKT,
  SelectedFields,
} from 'drizzle-orm/mysql-core'

declare module 'drizzle-orm/mysql-core' {
  interface MySqlSelectBuilder<
    TSelection extends SelectedFields | undefined,
    TPreparedQueryHKT extends PreparedQueryHKTBase,
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
      ? MySqlSelectQueryBuilderBase<
          MySqlSelectQueryBuilderHKT,
          undefined,
          TSelection,
          'partial'
          ,TPreparedQueryHKT
        >
      : never
  }
}

MySqlSelectBuilder.prototype.fromSingle = function (): any {
  const { fields }: { fields: SelectedFields | undefined } = this as any
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return this.from(sql.raw('(select 1) as "placeholder"'))
}
