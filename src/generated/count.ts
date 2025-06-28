import {
  sql,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import { getContext, getFilterSQL } from './internal'

interface CountQueryPromise extends PromiseLike<number> {
  toSQL: () => { sql: string; params: any[] }
}

declare module 'drizzle-orm/pg-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
  > {
    count(filter?: RelationsFilter<TFields, TSchema>): CountQueryPromise
  }
}

RelationalQueryBuilder.prototype.count = function (
  filter?: RelationsFilter<any, any>
): CountQueryPromise {
  const { table, dialect, session } = getContext(this)

  const query = sql`select count(*) AS "count" from ${table}`
  if (filter) {
    query.append(sql` where ${getFilterSQL(this, filter)}`)
  }

  return {
    // @start then
    then(onfulfilled, onrejected): any {
      return session
        .execute<{ count: number }[]>(query)
        .then(results => Number(results[0].count))
        .then(onfulfilled, onrejected)
    },
    // @end then
    toSQL: () => dialect.sqlToQuery(query),
  }
}
