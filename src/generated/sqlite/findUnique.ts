// @ts-nocheck
import {
  BuildQueryResult,
  DBQueryConfig,
  getColumns,
  KnownKeysOnly,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { SQLiteColumn as Column } from 'drizzle-orm/sqlite-core'
import { RelationalQueryBuilder } from 'drizzle-orm/sqlite-core/query-builders/query'
import { getContext, getTargetColumns } from './internal'

type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type FindUniqueConfig<
  TSchema extends TablesRelationalConfig,
  TFields extends TableRelationalConfig,
> = RequireKeys<DBQueryConfig<'one', TSchema, TFields>, 'where'>

declare module 'drizzle-orm/sqlite-core/query-builders/query' {
  export interface RelationalQueryBuilder<TMode extends 'sync' | 'async',
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig> {
    /**
     * Find a unique record by its primary key or unique constraint.
     *
     * You **MUST** define keys in the `where` option matching a primary key or
     * at least one unique constraint. These keys *cannot* be nested in
     * conditions like `OR` or `AND`, nor can they use the `RAW` escape hatch.
     *
     * **Note:** The current state of Drizzle's typings has no type-level
     * tracking of *composite* primary keys or *composite* unique constraints.
     * That means all we can do is throw at runtime (no compile-time warnings).
     */
    findUnique<TConfig extends FindUniqueConfig<TSchema, TFields>>(
      config: KnownKeysOnly<TConfig, FindUniqueConfig<TSchema, TFields>>
    ): RelationalQuery<BuildQueryResult<TSchema, TFields, TConfig> | undefined>
  }
}

RelationalQueryBuilder.prototype.findUnique = function (
  config: FindUniqueConfig<any, any>
): any {
  const { table } = getContext(this)

  const columns = getColumns(table)
  const usedColumns: Column[] = []
  for (const key in config.where) {
    if (key in columns) {
      usedColumns.push(columns[key])
    }
  }

  const target = getTargetColumns(table, usedColumns)
  if (!target) {
    throw new Error('No matching primary key or unique constraint found')
  }

  return this.findFirst(config)
}
