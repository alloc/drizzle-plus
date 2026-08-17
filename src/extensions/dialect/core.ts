import type {
  AnyRelations,
  ColumnsSelection,
  Query,
  SQL,
  SQLWrapper,
  SelectedFields as DrizzleSelectedFields,
  SelectedFieldsOrdered as DrizzleSelectedFieldsOrdered,
  Subquery,
  TableConfig,
  TablesRelationalConfig,
} from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { Column, QueryPromise, Table } from 'drizzle-orm'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export { Column, Table }
export type { TableConfig }

export declare function getTableConfig(table: Table): {
  primaryKeys: { columns: Column[] }[]
  uniqueConstraints: { columns: Column[] }[]
  indexes: {
    config: {
      columns: { name: string }[]
      unique?: boolean
    }
  }[]
}

export declare class Dialect {
  sqlToQuery(sql: SQL): Query
  buildSelection(fields: SelectedFieldsOrdered): SQL
  buildWithCTE(withList: Subquery[] | undefined): SQL | undefined
}

export declare class Session {
  objects<T = unknown>(query: SQL): Promise<T[]> | T[]
}

export type SelectedFields = DrizzleSelectedFields<Column, Table>
export type SelectedFieldsOrdered = DrizzleSelectedFieldsOrdered<Column>

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
  TRelations extends AnyRelations = AnyRelations,
  TTablesConfig extends TablesRelationalConfig = TablesRelationalConfig,
  TSchema extends V1.TablesRelationalConfig = V1.TablesRelationalConfig,
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

export declare class InsertBase extends QueryPromise<unknown> {
  constructor(...args: any[])
  execute(): Promise<unknown>
  toSQL(): Query
  onConflictDoNothing(): this
  returning(fields: unknown): this
}

export declare class InsertBuilder {
  constructor(...args: any[])
  select(query: unknown | ((qb: any) => unknown)): InsertQuery
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

export declare class UpdateBase extends QueryPromise<unknown> {
  constructor(...args: any[])
  execute(): Promise<unknown>
  toSQL(): Query
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

export declare abstract class SelectWithoutFromBase<
  TSelection extends SelectedFields,
> extends TypedQueryBuilder<TSelection, SelectResultFields<TSelection>[]> {}
