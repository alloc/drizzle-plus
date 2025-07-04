import {
  BuildRelationalQueryResult,
  getTableColumns,
  is,
  noopDecoder,
  QueryPromise,
  sql,
  SQL,
  Table,
  type DBQueryConfig,
  type DriverValueDecoder,
} from 'drizzle-orm'
import { isPlainObject } from 'radashi'
import type {
  AnyDialect,
  AnyQuery,
  AnySelectQuery,
  SQLExpression,
} from './types'

/**
 * Returns the name of a table, before it was aliased.
 */
export function getOriginalTableName<T extends Table>(
  table: T
): T['_']['config']['name'] {
  return (table as any)[Symbol.for('drizzle:OriginalName')]
}

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

export function getDialect(value: AnyQuery): AnyDialect {
  return (value as any).dialect
}

export function buildRelationalQuery(value: QueryPromise<any>) {
  const getQuery = (value as any)._getQuery as () => BuildRelationalQueryResult
  return getQuery.call(value)
}

export function createJsonArrayDecoder<T>(
  itemDecoder: DriverValueDecoder<T, any>
) {
  return (jsonString: string) => {
    const data: any[] = JSON.parse(jsonString)
    return itemDecoder !== noopDecoder
      ? data.map(item => itemDecoder.mapFromDriverValue(item))
      : data
  }
}

function isRawSelection(
  arg: AnySelectQuery | Record<string, unknown>
): arg is Record<string, unknown> {
  return isPlainObject(arg)
}

export function buildJsonProperties(
  subquery: AnySelectQuery | Record<string, unknown>,
  decoders?: Map<string, DriverValueDecoder<any, any>>
): SQL {
  const properties = sql.empty()

  Object.entries(
    isRawSelection(subquery) ? subquery : getSelectedFields(subquery)
  ).forEach(([key, column], index) => {
    if (index > 0) {
      properties.append(sql.raw(','))
    }
    properties.append(sql.raw(`'${key.replace(/'/g, "''")}'`))
    properties.append(sql.raw(','))
    if (isRawSelection(subquery) || !subquery._.alias) {
      properties.append(sql`${column}`)
    } else {
      properties.append(
        sql`${sql.identifier(subquery._.alias)}.${sql.identifier(key.replace(/"/g, '""'))}`
      )
    }
    if (decoders) {
      const decoder = getDecoder(column as SQLExpression<any>)
      if (decoder !== noopDecoder) {
        decoders.set(key, decoder)
      }
    }
  })

  return properties
}

export function createJsonObjectDecoder<T>(
  propertyDecoders: Map<string, DriverValueDecoder<any, any>>
) {
  return (jsonString: string): T => {
    const data: any = JSON.parse(jsonString)
    for (const [key, decoder] of propertyDecoders) {
      data[key] = decoder.mapFromDriverValue(data[key])
    }
    return data
  }
}
