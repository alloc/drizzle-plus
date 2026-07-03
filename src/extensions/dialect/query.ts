import { QueryPromise } from 'drizzle-orm'
import type {
  Query,
  TableRelationalConfig,
  TablesRelationalConfig,
} from 'drizzle-orm'

export type RelationalQueryHKTBase = unknown

export declare class RelationalQuery<
  THKT = unknown,
  TResult = unknown,
> extends QueryPromise<TResult> {
  _: { result: TResult }
  execute(): Promise<TResult>
  toSQL(): Query
}

export declare class RelationalQueryBuilder<
  TQueryContext = unknown,
  TSchema extends TablesRelationalConfig = TablesRelationalConfig,
  TFields extends TableRelationalConfig = TableRelationalConfig,
> {
  findMany(args?: unknown): QueryPromise<unknown[]> & { toSQL(): Query }
  findFirst(args?: unknown): RelationalQuery<unknown, unknown>
}
