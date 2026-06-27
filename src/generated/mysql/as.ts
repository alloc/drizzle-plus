// @ts-nocheck
import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { mapRelationalRow, sql, SQL } from 'drizzle-orm'
import {
  MySqlColumn,
  MySqlSelectHKTBase,
  MySqlSelectBuilder,
  SelectedFields,
  SelectedFieldsOrdered,
  WithSubqueryWithSelection,
} from 'drizzle-orm/mysql-core'
import {
  MySqlRelationalQuery,
  MySqlRelationalQueryHKTBase,
} from 'drizzle-orm/mysql-core/query-builders/query'
import { DecodedFields, ResultFieldsToSelection } from 'drizzle-plus/types'
import {
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'
import { buildRelationalQuery, createWithSubquery } from './internal'

export type MySqlRelationalSubquery<
  TResult,
  TAlias extends string,
> = WithSubqueryWithSelection<ResultFieldsToSelection<TResult>, TAlias>

declare module 'drizzle-orm/mysql-core/query-builders/query' {
  interface MySqlRelationalQuery<THKT extends MySqlRelationalQueryHKTBase, TResult> {
    as<TAlias extends string>(
      alias: TAlias
    ): MySqlRelationalSubquery<TResult, TAlias>
  }
}

MySqlRelationalQuery.prototype.as = function (alias: string): any {
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

declare module 'drizzle-orm/mysql-core' {
  interface MySqlSelectBuilder<
    TSelection extends SelectedFields | undefined,
    THKT extends MySqlSelectHKTBase,
    TPreparedQueryHKT extends PreparedQueryHKTBase,
  > {
    as<TAlias extends string>(
      alias: TAlias
    ): TSelection extends SelectedFields
      ? WithSubqueryWithSelection<TSelection, TAlias>
      : never
  }
}

MySqlSelectBuilder.prototype.as = function (alias): any {
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

  const orderedFields = orderSelectedFields<MySqlColumn>(fields)

  return createWithSubquery(
    sql`select ${dialect.buildSelection(orderedFields)}`,
    alias,
    mapSelectedFieldsToDecoders(orderedFields)
  )
}
