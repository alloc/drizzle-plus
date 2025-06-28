import {
  relationsFilterToSQL,
  sql,
  type BuildQueryResult,
  type DBQueryConfig,
  type KnownKeysOnly,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { CasingCache } from 'drizzle-orm/casing'
import { PgDialect, PgSession, PgTable } from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'

interface FindManyAndCountResult<T> {
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
  config?: any
): FindManyAndCountQueryPromise<any> {
  const { table, tableConfig, tableNamesMap, schema, dialect, session } =
    this as unknown as {
      tables: Record<string, PgTable>
      schema: TablesRelationalConfig
      tableNamesMap: Record<string, string>
      table: PgTable
      tableConfig: TableRelationalConfig
      dialect: PgDialect
      session: PgSession
    }

  const { casing } = dialect as unknown as {
    casing: CasingCache
  }

  // Get the filter from config
  const filter = config?.where as RelationsFilter<any, any> | undefined

  // Create the count query
  const countQuery = sql`select count(*) from ${table}`
  if (filter) {
    countQuery.append(
      sql` where ${relationsFilterToSQL(table, filter, tableConfig.relations, schema, tableNamesMap, casing)}`
    )
  }

  // Create the findMany query for toSQL()
  const findManyPromise = (this as any).findMany(config)

  // Capture the original RelationalQueryBuilder instance
  const originalThis = this as any

  return {
    // @start then
    then(onfulfilled, onrejected): any {
      // Execute both the findMany query and count query in parallel
      const countPromise = session
        .execute<{ count: number }[]>(countQuery)
        .then(results => Number(results[0].count))

      return Promise.all([findManyPromise, countPromise])
        .then(([data, count]) => ({ data, count }))
        .then(onfulfilled, onrejected)
    },
    // @end then
    toSQL: () => ({
      findMany: findManyPromise.toSQL(),
      count: dialect.sqlToQuery(countQuery),
    }),
  }
}
