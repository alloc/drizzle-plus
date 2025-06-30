import {
  BuildRelationalQueryResult,
  getTableColumns,
  is,
  QueryPromise,
  QueryWithTypings,
  SQL,
  Table,
  type DBQueryConfig,
  type DriverValueDecoder,
} from 'drizzle-orm'
import type { AnyQuery, SQLExpression } from './types'

export function getSelectedFields(query: AnyQuery): Record<string, unknown> {
  if (query instanceof QueryPromise) {
    const { config, table }: { config: DBQueryConfig; table: Table } =
      query as any

    return {
      ...(config.columns || getTableColumns(table)),
      ...config.with,
      ...config.extras,
    }
  }
  return query._.selectedFields
}

export function getDecoder<T>(
  value: SQLExpression<T>
): DriverValueDecoder<T, any> {
  if (is(value, SQL.Aliased)) {
    return (value.getSQL() as any).decoder
  }
  if (is(value, SQL)) {
    return (value as any).decoder
  }
  return value as any
}

export function getSQL(value: AnyQuery): SQL {
  return (value as any).getSQL()
}

type AnyDialect = {
  sqlToQuery(sql: SQL): QueryWithTypings
}

export function getDialect(value: AnyQuery): AnyDialect {
  return (value as any).dialect
}

export function buildRelationalQuery(value: QueryPromise<any>) {
  const getQuery = (value as any)._getQuery as () => BuildRelationalQueryResult
  return getQuery.call(value)
}
