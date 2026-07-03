import type { TableRelationalConfig, TablesRelationalConfig } from 'drizzle-orm'

export type RelationalQueryHKTBase = unknown

export declare class RelationalQuery<THKT = unknown, TResult = unknown> {
  _: { result: TResult }
}

export declare class RelationalQueryBuilder<
  TQueryContext = unknown,
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
  TFields extends TableRelationalConfig = TableRelationalConfig,
> {
  findMany(args?: unknown): Promise<unknown[]>
  findFirst(args?: unknown): RelationalQuery<unknown, unknown>
}
