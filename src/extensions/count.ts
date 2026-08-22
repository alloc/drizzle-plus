import {
  BuildRelationalQueryResult,
  QueryPromise,
  SQL,
  sql,
  type RelationsFilter,
  type TableRelationalConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm'
import { Dialect, Session, Table } from '#dialect/core'
import { RelationalQueryBuilder } from '#dialect/query'
import { getContext, getFilterSQL } from './internal'

declare module '#dialect/query' {
  export interface RelationalQueryBuilder<
    TQueryContext = unknown,
    TSchema extends TablesRelationalConfig = TablesRelationalConfig,
    TFields extends TableRelationalConfig = TableRelationalConfig,
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
    private table: Table,
    private filter: SQL | undefined,
    private session: Session,
    private dialect: Dialect
  ) {
    super()
  }

  async execute() {
    const query = this.getSQL()
    const [result] = (await this.session.objects(query)) as [any]
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
