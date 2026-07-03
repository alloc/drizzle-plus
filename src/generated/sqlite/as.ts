// @ts-nocheck
import { mapRelationalRow, sql, SQL } from 'drizzle-orm'
import {
  SQLiteColumn as Column,
  SQLiteSelectHKTBase as SelectHKTBase,
  SQLiteSelectBuilder as SelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from 'drizzle-orm/sqlite-core'
import { SQLiteRelationalQuery as RelationalQuery, SQLiteRelationalQueryHKTBase as RelationalQueryHKTBase } from 'drizzle-orm/sqlite-core/query-builders/query'
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
    ): SQLiteRelationalSubquery<TResult, TAlias>
  }
}

RelationalQuery.prototype.as = function (alias: string): any {
  const { sql, selection } = buildRelationalQuery(this)

  const decodedFields: DecodedFields = {}
  for (const item of selection) {
    decodedFields[item.key] = {
      mapFromDriverValue(value: unknown) {
        return mapRelationalRow({ [item.key]: value }, [item])[item.key]
      },
    }
  }

  return createWithSubquery(sql, alias, decodedFields)
}

declare module 'drizzle-orm/sqlite-core' {
  interface SQLiteSelectBuilder<
    TSelection extends SelectedFields | undefined,
    THKT extends SelectHKTBase,
    TResultType extends 'sync' | 'async',
    TRunResult,
  > {
    as<TAlias extends string>(
      alias: TAlias
    ): TSelection extends SelectedFields
      ? WithSubqueryWithSelection<TSelection, TAlias>
      : never
  }
}

SelectBuilder.prototype.as = function (alias): any {
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

  const orderedFields = orderSelectedFields<Column>(fields)

  return createWithSubquery(
    sql`select ${dialect.buildSelection(orderedFields)}`,
    alias,
    mapSelectedFieldsToDecoders(orderedFields)
  )
}
