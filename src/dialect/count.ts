import {
  relationsFilterToSQL,
  sql,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { CasingCache } from 'drizzle-orm/casing'
import { PgDialect, PgSession, PgTable } from 'drizzle-orm/pg-core'
import { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'

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

  const query = sql`select count(*) from ${table}`
  if (filter) {
    query.append(
      sql` where ${relationsFilterToSQL(table, filter, tableConfig.relations, schema, tableNamesMap, casing)}`
    )
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
