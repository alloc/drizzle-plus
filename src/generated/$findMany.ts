import type {
  DBQueryConfig,
  TableRelationalConfig,
  TablesRelationalConfig,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { AnyDBQueryConfig } from 'drizzle-plus/types'
import { mergeFindManyArgs, type MergeFindManyArgs } from './mergeFindManyArgs'

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    $findMany<const TConfig extends DBQueryConfig<'many', TSchema, TFields>>(
      config: TConfig
    ): TConfig

    $findMany<
      TBaseConfig extends DBQueryConfig<'many', TSchema, TFields>,
      const TConfig extends DBQueryConfig<'many', TSchema, TFields>,
    >(
      baseConfig: TBaseConfig,
      config: TConfig
    ): MergeFindManyArgs<TBaseConfig, TConfig>
  }
}

RelationalQueryBuilder.prototype.$findMany = function (
  config1: AnyDBQueryConfig,
  config2?: AnyDBQueryConfig
): any {
  return config2 ? mergeFindManyArgs(config1, config2) : config1
}
