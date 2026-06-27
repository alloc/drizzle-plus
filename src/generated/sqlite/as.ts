// @ts-nocheck
import { mapRelationalRow, sql, SQL } from 'drizzle-orm'
import {
  SQLiteColumn,
  SQLiteSelectHKTBase,
  SQLiteSelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from 'drizzle-orm/sqlite-core'
import {
  SQLiteRelationalQuery,
  SQLiteRelationalQueryHKTBase,
} from 'drizzle-orm/sqlite-core/query-builders/query'
import { DecodedFields, ResultFieldsToSelection } from 'drizzle-plus/types'
import {
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'
import { buildRelationalQuery, createWithSubquery } from './internal'

export type SQLiteRelationalSubquery<
  TResult,
  TAlias extends string,
> = WithSubqueryWithSelection<ResultFieldsToSelection<TResult>, TAlias>

declare module 'drizzle-orm/sqlite-core/query-builders/query' {
  interface SQLiteRelationalQuery<
    TType extends 'sync' | 'async',
    TResult,
  > {
    as<TAlias extends string>(
      alias: TAlias
    ): TSelection extends SelectedFields
      ? WithSubqueryWithSelection<TSelection, TAlias>
      : never
  }
}

SQLiteSelectBuilder.prototype.as = function (alias): any {
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

  const orderedFields = orderSelectedFields<SQLiteColumn>(fields)

  return createWithSubquery(
    sql`select ${dialect.buildSelection(orderedFields)}`,
    alias,
    mapSelectedFieldsToDecoders(orderedFields)
  )
}
