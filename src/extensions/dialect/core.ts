import type {
  ColumnsSelection,
  Query,
  QueryPromise,
  SQL,
  SQLWrapper,
  Subquery,
} from 'drizzle-orm'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export type TableConfig = {
  name: string
  schema: string | undefined
  columns: Record<string, Column>
  dialect: string
}

export declare class Column<T = any> {
  _: T
  name: string
  hasDefault?: boolean
  generated?: unknown
  generatedIdentity?: unknown
  getSQLType(): string
}

export declare class Table<T extends TableConfig = TableConfig> {
  _: T
}

export declare function getTableConfig(table: Table): {
  primaryKeys: { columns: Column[] }[]
  uniqueConstraints: { columns: Column[] }[]
  uniqueIndexes: {
    config: {
      columns: ({ name: string } | unknown)[]
    }
  }[]
}

export declare class Dialect {
  casing: {
    getColumnCasing(column: Column): string
  }
  sqlToQuery(sql: SQL): Query
  buildSelection(fields: SelectedFieldsOrdered): SQL
  buildWithCTE(withList: Subquery[] | undefined): SQL | undefined
}

export declare class Session {
  all(query: SQL): Promise<unknown[]>
}

export type SelectedFields = Record<string, unknown>
export type SelectedFieldsOrdered = { path: string[]; field: unknown }[]

export type WithSubqueryWithSelection<
  TSelection,
  TAlias extends string,
> = Subquery<TAlias, TSelection & Record<string, unknown>> & TSelection

export type WithBuilder = {
  <TAlias extends string>(
    alias: TAlias,
    selection?: ColumnsSelection
  ): {
    as<TSelection>(query: TSelection): WithSubqueryWithSelection<any, TAlias>
  }
}

export declare class Database<
  TQueryResult = unknown,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
  TRelations = unknown,
  TTablesConfig = unknown,
  TSchema = unknown,
> {
  $with: WithBuilder
  select<TSelection extends SelectedFields>(
    fields: TSelection
  ): SelectBuilder<TSelection>
}

export declare class QueryBuilder {
  select<TSelection extends SelectedFields>(
    fields: TSelection
  ): SelectBuilder<TSelection>
}

export declare class InsertBase {
  constructor(...args: any[])
  onConflictDoNothing(): this
  returning(fields: unknown): this
}

export declare class InsertBuilder {
  constructor(...args: any[])
  select(query: unknown): InsertQuery
  values(values: unknown): InsertQuery
}

export type InsertConfig = {
  values: unknown
}

export type InsertValue<TTable extends Table> = Partial<TTable['_']['columns']>
export type InsertSelectQueryBuilder<TTable extends Table> = {
  _: { selectedFields: unknown }
  config: { fields: Record<string, unknown> }
}
export type InsertQuery = QueryPromise<unknown> & {
  onConflictDoUpdate(config: unknown): unknown
  onConflictDoNothing(): unknown
  returning(fields: unknown): unknown
}

export type UpdateSetSource<TTable extends Table> = Partial<
  TTable['_']['columns']
>

export declare class UpdateBase {
  constructor(...args: any[])
  where(where: unknown): this
  returning(fields: unknown): this
}

export declare class SelectBuilder<
  TSelection extends SelectedFields | undefined = SelectedFields | undefined,
  THKT = unknown,
  TResultType extends 'sync' | 'async' = 'async',
  TRunResult = unknown,
  TBuilderMode extends 'db' | 'qb' = 'db',
  TPreparedQueryHKT = unknown,
> {
  fields?: TSelection
  dialect: Dialect
  from(source: unknown): SelectQueryBuilderBase<TSelection>
}

export type SelectHKTBase = unknown
export type SelectQueryBuilderHKT = unknown

export declare class SelectQueryBuilderBase<
  THKT = unknown,
  TTableName = unknown,
  TSelection extends SelectedFields | undefined = SelectedFields | undefined,
  TSelectMode = unknown,
  TResultType extends 'sync' | 'async' = 'async',
  TRunResult = unknown,
  TPreparedQueryHKT = unknown,
> {
  getSQL(): SQL
}

export type SelectConfig = {
  fields: SelectedFields
  withList?: Subquery[]
}

export declare class SelectBase {
  _prepare(): {
    execute(placeholderValues?: Record<string, unknown>): Promise<unknown[]>
  }
}

export interface SetOperatorWithResult<TResult> {
  _: { result: TResult }
}

export declare class SelectWithoutFromBase<
  TSelection extends SelectedFields,
> extends TypedQueryBuilder<TSelection, SelectResultFields<TSelection>[]> {}
