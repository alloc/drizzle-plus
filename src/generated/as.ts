// mysql-insert: import { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { getTableColumns, is, sql, SQL, Table, WithSubquery } from 'drizzle-orm'
import {
  PgColumn,
  PgSelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from 'drizzle-orm/pg-core'
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

PgRelationalQuery.prototype.as = function (alias: string) {
  return createWithSubquery(getSQL(this), getSelectedFields(this), alias)
}

declare module 'drizzle-orm/pg-core' {
  interface PgSelectBuilder<
    TSelection extends SelectedFields | undefined,
    // mysql-insert: TPreparedQueryHKT extends PreparedQueryHKTBase,
    // sqlite-insert: TResultType extends 'sync' | 'async', TRunResult,
    TBuilderMode extends 'db' | 'qb',
  > {
    as<TAlias extends string>(
      alias: TAlias
    ): TSelection extends SelectedFields
      ? WithSubqueryWithSelection<TSelection, TAlias>
      : never
  }
}

PgSelectBuilder.prototype.as = function (alias) {
  const {
    fields,
    dialect,
  }: {
    fields: SelectedFields | undefined
    dialect: { buildSelection: (fields: SelectedFieldsOrdered) => SQL }
  } = this as any

  if (!fields) {
    throw new Error('Cannot alias a select query without a selection')
  }

  const selection = dialect.buildSelection(orderSelectedFields(fields))
  return createWithSubquery(sql`select ${selection}`, fields, alias)
}

// Adapted from https://github.com/drizzle-team/drizzle-orm/blob/109ccd34b549030e10dd9cd27e41641d0878a856/drizzle-orm/src/utils.ts#L74
function orderSelectedFields(
  fields: Record<string, unknown>,
  pathPrefix?: string[]
) {
  const result: SelectedFieldsOrdered = []
  for (const name in fields) {
    if (!Object.prototype.hasOwnProperty.call(fields, name)) continue
    if (typeof name !== 'string') continue

    const field = fields[name]
    const newPath = pathPrefix ? [...pathPrefix, name] : [name]
    if (is(field, PgColumn) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field })
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(getTableColumns(field), newPath))
    } else {
      result.push(
        ...orderSelectedFields(field as Record<string, unknown>, newPath)
      )
    }
  }
  return result
}

export function createWithSubquery(
  query: SQL,
  selectedFields: Record<string, unknown>,
  alias: string
): any {
  const selection: Record<string, SQL> = {}
  for (const key in selectedFields) {
    if (Object.hasOwn(selectedFields, key) && selectedFields[key]) {
      // The identifier must be fully-qualified to avoid ambiguity.
      selection[key] = sql`${sql.identifier(alias)}.${sql.identifier(key)}`
    }
  }

  // Adapted from https://github.com/drizzle-team/drizzle-orm/blob/109ccd34b549030e10dd9cd27e41641d0878a856/drizzle-orm/src/pg-core/db.ts#L175
  return new Proxy(
    new WithSubquery(query, selection, alias, true),
    new SelectionProxyHandler({
      alias,
      // All values of `selection` are SQL objects. This option allows accessing
      // the SQL object directly by its field name.
      sqlBehavior: 'sql',
    })
  )
}
