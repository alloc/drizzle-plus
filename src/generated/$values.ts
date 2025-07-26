// mysql-insert: import { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import {
  AnyRelations,
  DrizzleError,
  getTableColumns,
  is,
  SQL,
  SQLChunk,
  Subquery,
  TablesRelationalConfig,
} from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import {
  PgColumn,
  PgDatabase,
  PgTable,
  TableConfig,
  WithSubqueryWithSelection,
} from 'drizzle-orm/pg-core'
import { sql, SQLWrapper } from 'drizzle-orm/sql'
import type { SQLType } from 'drizzle-plus/pg'
import { SelectionFromAnyObject } from 'drizzle-plus/types'
import { pushStringChunk } from 'drizzle-plus/utils'
import { createWithSubquery } from './as'
import { setWithSubqueryAddons } from './internal'

type PgTableWithTheseColumns<K extends string> = PgTable<
  Omit<TableConfig, 'columns'> & { columns: Record<K, PgColumn> }
>

declare module 'drizzle-orm/pg-core' {
  interface PgDatabase<
    // sqlite-insert: TResultKind extends 'sync' | 'async',
    // sqlite-insert: TRunResult,
    // sqlite-remove-next-line
    TQueryResult extends import('drizzle-orm/pg-core').PgQueryResultHKT,
    // mysql-insert: TPreparedQueryHKT extends PreparedQueryHKTBase,
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
        | PgTableWithTheseColumns<string & keyof TRow>
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
        rows: TRow[],
        typings?:
          | { [K in keyof TRow]?: SQLType }
          | PgTableWithTheseColumns<string & keyof TRow>
      ): WithSubqueryWithSelection<SelectionFromAnyObject<TRow>, string>
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
PgDatabase.prototype.$values = function (
  rows: readonly Record<string, unknown>[],
  typings?: Partial<Record<string, SQLType>> | PgTable
): ValuesList<any> {
  if (!rows.length) {
    throw new DrizzleError({ message: 'No rows provided' })
  }
  const casing = (this as any).dialect.casing
  return new ValuesList(casing, Object.keys(rows[0]), rows, typings)
}

PgDatabase.prototype.$withValues = function (
  alias: string,
  rows: Record<string, unknown>[],
  typings?: Partial<Record<string, SQLType>> | PgTable
): any {
  const withSubquery = createWithSubquery(
    this.$values(rows, typings).getSQL(),
    rows[0],
    alias
  )
  return setWithSubqueryAddons(withSubquery, {
    columns: Object.keys(rows[0]),
  })
}

export type ValuesListSubquery<
  TAlias extends string,
  TSelectedFields extends Record<string, unknown> = Record<string, unknown>,
> = Subquery<TAlias, TSelectedFields> & {
  [K in keyof TSelectedFields]: SQL
}

export class ValuesList<
  TSelectedFields extends Record<string, unknown> = Record<string, unknown>,
> implements SQLWrapper<unknown>
{
  declare _: {
    selectedFields: TSelectedFields
  }
  private shouldInlineParams = false
  private typings?: Partial<Record<string, SQLType | PgColumn>>
  constructor(
    private casing: { convert: (key: string) => string },
    private keys: string[],
    private rows: readonly object[],
    typings?: Partial<Record<string, SQLType>> | PgTable
  ) {
    this.typings =
      typings && (is(typings, PgTable) ? getTableColumns(typings) : typings)
  }

  as<TAlias extends string>(
    alias: TAlias
  ): ValuesListSubquery<TAlias, TSelectedFields> {
    const columnList = this.keys.map(key => this.casing.convert(key))
    const selectedFields: Record<string, unknown> = {}
    this.keys.forEach((key, index) => {
      selectedFields[key] =
        sql`${sql.identifier(alias)}.${sql.identifier(columnList[index])}`
    })
    return new Proxy(
      new Subquery(this.getSQL(), selectedFields, alias, false, columnList),
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
            value = sql`cast(${value} as ${sql.raw(is(type, PgColumn<any>) ? type.getSQLType() : type)})`
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
