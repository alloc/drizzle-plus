// @ts-nocheck
import {
  BuildRelationalQueryResult,
  QueryPromise,
  SQL,
  sql,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { MySqlDialect, MySqlSession, MySqlTable } from 'drizzle-orm/mysql-core'
import { RelationalQueryBuilder } from 'drizzle-orm/mysql-core/query-builders/query'
import { getContext, getFilterSQL } from './internal'

declare module 'drizzle-orm/mysql-core/query-builders/query' {
  export interface RelationalQueryBuilder<
    TPreparedQueryHKT extends import('drizzle-orm/mysql-core').PreparedQueryHKTBase,
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

  return new CountQueryPromise(
    table,
    filter && getFilterSQL(this, filter),
    session,
    dialect
  )
}

export class CountQueryPromise extends QueryPromise<number> {
  constructor(
    private table: MySqlTable,
    private filter: SQL | undefined,
    private session: MySqlSession,
    private dialect: MySqlDialect
  ) {
    super()
  }

  async execute() {
    const query = this.getSQL()
    const [result] = (await this.session.all(query)) as [any]
    return Number(result.count)
  }

  toSQL() {
    return this.dialect.sqlToQuery(this.getSQL())
  }

  getSQL() {
    const query = sql`select count(*) AS "count" from ${this.table}`
    if (this.filter) {
      query.append(sql` where ${this.filter}`)
    }
    return query
  }

  // Used by our nest() implementation.
  protected _getQuery(): BuildRelationalQueryResult {
    return {
      sql: this.getSQL(),
      selection: [{ key: 'count', field: sql`count(*)`.mapWith(Number) }],
    }
  }
}
