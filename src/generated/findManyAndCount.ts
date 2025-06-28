import {
  type BuildQueryResult,
  type DBQueryConfig,
  type KnownKeysOnly,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import './count'

export interface FindManyAndCountResult<T> {
  data: T[]
  count: number
}

interface FindManyAndCountQueryPromise<T>
  extends PromiseLike<FindManyAndCountResult<T>> {
  toSQL: () => {
    findMany: { sql: string; params: any[] }
    count: { sql: string; params: any[] }
  }
}

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    findManyAndCount<TConfig extends DBQueryConfig<'many', TSchema, TFields>>(
      config?: KnownKeysOnly<TConfig, DBQueryConfig<'many', TSchema, TFields>>
    ): FindManyAndCountQueryPromise<BuildQueryResult<TSchema, TFields, TConfig>>
  }
}

RelationalQueryBuilder.prototype.findManyAndCount = function (
  config?: DBQueryConfig<any, any, any>
): FindManyAndCountQueryPromise<any> {
  const findManyPromise = this.findMany(config)
  const countQuery = this.count(config?.where)

  return {
    then(onfulfilled, onrejected): any {
      // Execute both the findMany query and count query in parallel
      return Promise.all([findManyPromise, countQuery])
        .then(([data, count]) => ({ data, count }))
        .then(onfulfilled, onrejected)
    },
    toSQL: () => ({
      findMany: findManyPromise.toSQL(),
      count: countQuery.toSQL(),
    }),
  }
}
