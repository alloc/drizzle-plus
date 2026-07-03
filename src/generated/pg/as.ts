// @ts-nocheck
import { mapRelationalRow, sql, SQL } from 'drizzle-orm'
import {
  PgColumn as Column,
  PgSelectHKTBase as SelectHKTBase,
  PgSelectBuilder as SelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from 'drizzle-orm/pg-core'
import { PgRelationalQuery as RelationalQuery, PgRelationalQueryHKTBase as RelationalQueryHKTBase } from 'drizzle-orm/pg-core/query-builders/query'
import { DecodedFields, ResultFieldsToSelection } from 'drizzle-plus/types'
import {
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'
import { buildRelationalQuery, createWithSubquery } from './internal'

export type PgRelationalSubquery<
  TResult,
  TAlias extends string,
> = WithSubqueryWithSelection<ResultFieldsToSelection<TResult>, TAlias>

declare module 'drizzle-orm/pg-core/query-builders/query' {
  interface PgRelationalQuery<
    THKT extends PgRelationalQueryHKTBase,
    TResult,
  > {
    as<TAlias extends string>(
      alias: TAlias
    ): PgRelationalSubquery<TResult, TAlias>
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

declare module 'drizzle-orm/pg-core' {
  interface PgSelectBuilder<
    TSelection extends SelectedFields | undefined,
    THKT extends SelectHKTBase,
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
