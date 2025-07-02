import { ColumnsSelection } from 'drizzle-orm'
import {
  QueryBuilder,
  WithBuilder,
  WithSubqueryWithSelection,
} from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { setWithSubqueryFlags } from './internal'

export interface WithRecursiveBuilder {
  <TAlias extends string>(
    alias: TAlias
  ): {
    as: <TSelection extends ColumnsSelection>(
      subquery:
        | TypedQueryBuilder<TSelection>
        | ((qb: QueryBuilder) => TypedQueryBuilder<TSelection>),
      recursive: (
        subquery: WithSubqueryWithSelection<TSelection, TAlias>
      ) => TypedQueryBuilder<TSelection>
    ) => WithSubqueryWithSelection<TSelection, TAlias>
  }
  // <TAlias extends string, TSelection extends ColumnsSelection>(
  //   alias: TAlias,
  //   selection: TSelection
  // ): {
  //   as: (
  //     qb: SQL | ((qb: QueryBuilder) => SQL)
  //   ) => WithSubqueryWithSelection<TSelection, TAlias>
  // }
}

declare module 'drizzle-orm/pg-core' {
  interface QueryBuilder {
    /**
     */
    $withRecursive: WithBuilder
  }
}

QueryBuilder.prototype.$withRecursive = function (alias: string) {
  return withRecursive(this.$with(alias), { recursive: true })
}

function withRecursive(
  withBuilder: ReturnType<WithBuilder>,
  flags: { recursive: true }
) {
  const originalMethod = withBuilder.as
  withBuilder.as = function (arg: any) {
    const subquery = originalMethod(arg)
    setWithSubqueryFlags(subquery, flags)
    return subquery
  }
  return withBuilder
}
