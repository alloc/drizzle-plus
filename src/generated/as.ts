import { sql, SQL, WithSubquery } from 'drizzle-orm'
import { WithSubqueryWithSelection } from 'drizzle-orm/pg-core'
import { PgRelationalQuery } from 'drizzle-orm/pg-core/query-builders/query'
import { SelectionProxyHandler } from 'drizzle-orm/selection-proxy'
import { getSelectedFields, getSQL } from 'drizzle-plus/utils'

type MapResultToSelection<TResult> = TResult extends undefined
  ? never
  : TResult extends readonly (infer TElement)[]
    ? { [K in keyof TElement]: SQL<TElement[K]> }
    : { [K in keyof TResult]: SQL<TResult[K]> }

export type PgRelationalSubquery<
  TResult,
  TAlias extends string,
> = WithSubqueryWithSelection<MapResultToSelection<TResult>, TAlias>

declare module 'drizzle-orm/pg-core/query-builders/query' {
  interface PgRelationalQuery<TResult> {
    as<TAlias extends string>(
      alias: TAlias
    ): PgRelationalSubquery<TResult, TAlias>
  }
}

PgRelationalQuery.prototype.as = function (
  alias: string
): PgRelationalSubquery<any, any> {
  const selection: Record<string, unknown> = {}

  // Derive the selection from the combination of `columns`, `with`, and `extras` options.
  const selectedFields = getSelectedFields(this)
  for (const key in selectedFields) {
    if (selectedFields[key] !== undefined && selectedFields[key] !== false) {
      selection[key] = sql`${sql.identifier(key)}`.as(key)
    }
  }

  // https://github.com/drizzle-team/drizzle-orm/blob/109ccd34b549030e10dd9cd27e41641d0878a856/drizzle-orm/src/pg-core/db.ts#L175
  return new Proxy(
    new WithSubquery(getSQL(this), selection, alias, true),
    new SelectionProxyHandler({
      alias,
      sqlAliasedBehavior: 'alias',
      sqlBehavior: 'error',
    })
  )
}
