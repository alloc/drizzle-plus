/* #dialect.extraTypeImports */
import { mapRelationalRow, sql, SQL } from 'drizzle-orm'
import {
  Column,
  SelectHKTBase,
  SelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from '#dialect/core'
import { RelationalQuery, RelationalQueryHKTBase } from '#dialect/query'
import { DecodedFields, ResultFieldsToSelection } from 'drizzle-plus/types'
import {
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'
import { buildRelationalQuery, createWithSubquery } from './internal'

export type RelationalSubquery<
  TResult,
  TAlias extends string,
> = WithSubqueryWithSelection<ResultFieldsToSelection<TResult>, TAlias>

declare module '#dialect/query' {
  interface RelationalQuery</* #dialect.relationalQueryTypeParams */> {
    as<TAlias extends string>(
      alias: TAlias
    ): RelationalSubquery<TResult, TAlias>
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

declare module '#dialect/core' {
  interface SelectBuilder</* #dialect.selectBuilderAsTypeParams */> {
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
