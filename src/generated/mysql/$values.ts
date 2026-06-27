// @ts-nocheck
import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import {
  AnyRelations,
  DrizzleError,
  getColumns,
  is,
  SQL,
  SQLChunk,
  Subquery,
  TablesRelationalConfig,
} from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import {
  MySqlColumn,
  MySqlTable,
  TableConfig,
  WithSubqueryWithSelection,
} from 'drizzle-orm/mysql-core'
import { noopDecoder, sql, SQLWrapper } from 'drizzle-orm/sql'
import type { SQLType } from 'drizzle-plus/mysql'
import { DecodedFields, RawFieldsToSelection } from 'drizzle-plus/types'
import { pushStringChunk } from 'drizzle-plus/utils'
import { createWithSubquery, setWithSubqueryAddons } from './internal'

type MySqlTableWithTheseColumns<K extends string> = MySqlTable<
  Omit<TableConfig, 'columns'> & { columns: Record<K, MySqlColumn> }
>

declare module 'drizzle-orm/mysql-core' {
  interface MySqlDatabase<
    TQueryResult extends import('drizzle-orm/mysql-core').MySqlQueryResultHKT,
    TPreparedQueryHKT extends PreparedQueryHKTBase,
    TFullSchema extends Record<string, unknown>,
    TRelations extends AnyRelations,
    TTablesConfig extends TablesRelationalConfig,
    TSchema extends V1.TablesRelationalConfig,
  > {
    /**
     * Allows you to declare a values list as raw SQL or a subquery. Use the
     * `getSQL` method to get the raw SQL. Use the `as` method to get a
     * subquery.
     *
     * @example
     * ```ts
     * const myValues = db.$values([{ a: 1 }, { a: 2 }])
     *
     * db.select().from(myValues.as('my_values'))
     * ```
     */
    $values<TRow extends Record<string, unknown>>(
      rows: readonly TRow[],
      typings?:
        | { [K in keyof TRow]?: SQLType }
        | MySqlTableWithTheseColumns<string & keyof TRow>
    ): ValuesList<TRow>
    /**
     * Allows you to declare a values list in a CTE.
     *
     * @example
     * ```ts
     * const myValues = db.$withValues('my_values', [{ a: 1 }, { a: 2 }])
     *
     * db.with(myValues).select().from(myValues)
     * ```
     */
    $withValues: {
      <TAlias extends string, TRow extends Record<string, unknown>>(
        alias: TAlias,
        rows: readonly TRow[],
        typings?:
          | { [K in keyof TRow]?: SQLType }
          | MySqlTableWithTheseColumns<string & keyof TRow>
      ): WithSubqueryWithSelection<RawFieldsToSelection<TRow>, string>
    }
  }
}

/**
 * Produces a SQL `values` list of one or more rows.
 *
 * The given array may contain tuples or objects. Each tuple/object **must have
 * the exact same keys** as the first row in the array, or unexpected behavior
 * may occur.
 *
 * @example
 * ```ts
 * db.select().from(db.$values([{ a: 1 }, { a: 2 }]).as('my_values'))
 * ```
 */
MySqlDatabase.prototype.$values = function (
  rows: readonly Record<string, unknown>[],
  typings?: Partial<Record<string, SQLType>> | MySqlTable
): any {
  if (!rows.length) {
    throw new DrizzleError({ message: 'No rows provided' })
  }
  const casing = (this as any).dialect.casing
  return new ValuesList(casing, Object.keys(rows[0]), rows, typings)
}

MySqlDatabase.prototype.$withValues = function (
  alias: string,
  rows: readonly Record<string, unknown>[],
  typings?: Partial<Record<string, SQLType>> | MySqlTable
): any {
  const withSubquery = createWithSubquery(
    this.$values(rows, typings).getSQL(),
    alias,
    new Proxy(rows[0] as DecodedFields, {
      get: (_, key: string) =>
        (is(typings, MySqlTable) && getColumns(typings)[key]) || noopDecoder,
    })
  )
  return setWithSubqueryAddons(withSubquery, {
    columns: Object.keys(rows[0]),
  })
}

export type ValuesListSubquery<
  TAlias extends string,
  TValues extends Record<string, unknown>,
> =
  RawFieldsToSelection<TValues> extends infer TSelectedFields
    ? Subquery<TAlias, TSelectedFields & Record<string, unknown>> &
        TSelectedFields
    : never

export class ValuesList<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> implements SQLWrapper<unknown> {
  declare _: {
    selectedFields: RawFieldsToSelection<TValues>
  }
  private shouldInlineParams = false
  private typings?: Partial<Record<string, SQLType | MySqlColumn>>
  constructor(
    private casing: { convert: (key: string) => string },
    private keys: string[],
    private rows: readonly object[],
    typings?: Partial<Record<string, SQLType>> | MySqlTable
  ) {
    this.typings =
      typings && (is(typings, MySqlTable) ? getColumns(typings) : typings)
  }

  as<TAlias extends string>(
    alias: TAlias
  ): ValuesListSubquery<TAlias, TValues> {
    const columnList = this.keys.map(key => this.casing.convert(key))
    const selectedFields: Record<string, unknown> = {}
    this.keys.forEach((key, index) => {
      const field = (selectedFields[key] =
        sql`${sql.identifier(alias)}.${sql.identifier(columnList[index])}`)

      const type = this.typings?.[key]
      if (is(type, MySqlColumn)) {
        field.mapWith(type)
      }
    })
    return new Proxy(
      new Subquery(this.getSQL(), selectedFields, alias, false, [], columnList),
      {
        get: (target: any, key: string) => {
          if (key in selectedFields) {
            return selectedFields[key]
          }
          return target[key]
        },
      }
    )
  }

  getSQL() {
    const chunks: SQLChunk[] = []

    pushStringChunk(chunks, 'values ')

    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      pushStringChunk(chunks, '(')

      let row: any = this.rows[rowIndex]
      this.keys.forEach((key, keyIndex) => {
        let value = row[key] as SQLChunk
        if (value === undefined) {
          throw new DrizzleError({
            message: 'Undefined values are not allowed in a ValuesList.',
          })
        }

        // The first row is used to infer the type of the values list.
        if (rowIndex === 0) {
          let type = this.typings?.[key]
          if (type) {
            value = sql`cast(${value} as ${sql.raw(is(type, MySqlColumn<any>) ? type.getSQLType() : type)})`
          }
        }

        chunks.push(value)

        if (keyIndex < this.keys.length - 1) {
          pushStringChunk(chunks, ', ')
        }
      })

      pushStringChunk(chunks, ')')

      if (rowIndex < this.rows.length - 1) {
        pushStringChunk(chunks, ', ')
      }
    }

    const query = new SQL(chunks)
    return this.shouldInlineParams ? query.inlineParams() : query
  }

  inlineParams() {
    this.shouldInlineParams = true
    return this
  }
}
