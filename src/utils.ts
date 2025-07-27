import {
  BuildRelationalQueryResult,
  Column,
  getTableColumns,
  is,
  noopDecoder,
  QueryPromise,
  sql,
  SQL,
  SQLChunk,
  StringChunk,
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

// https://github.com/drizzle-team/drizzle-orm/blob/c0277c07720f3717da8068a65c776fe343cbe2fa/drizzle-orm/src/relations.ts#L786-L794
export function getDecoder<T>(
  value: SQLExpression<T>
): DriverValueDecoder<T, any> {
  let decoder: DriverValueDecoder<T, any>
  if (is(value, Column)) {
    decoder = value as any
  } else if (is(value, SQL)) {
    decoder = (value as any).decoder
  } else if (is(value, SQL.Aliased)) {
    decoder = (value.sql as any).decoder
  } else {
    decoder = (value.getSQL() as any).decoder
  }
  if (
    'mapFromJsonValue' in decoder &&
    typeof decoder.mapFromJsonValue === 'function'
  ) {
    return {
      mapFromDriverValue: decoder.mapFromJsonValue.bind(decoder),
    }
  }
  return decoder
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
  return (result: unknown) => {
    const items: any[] =
      typeof result === 'string' ? JSON.parse(result) : result

    return itemDecoder !== noopDecoder
      ? items.map(item => itemDecoder.mapFromDriverValue(item))
      : items
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
  return (result: unknown): T => {
    const object: any = typeof result === 'string' ? JSON.parse(result) : result
    for (const [key, decoder] of propertyDecoders) {
      object[key] = decoder.mapFromDriverValue(object[key])
    }
    return object
  }
}

export function getDefinedColumns<TColumn extends Column>(
  columns: Record<string, TColumn>,
  data: any[]
) {
  const usedColumns: Record<string, TColumn> = {}
  for (const key of Object.keys(columns)) {
    for (const object of data) {
      if (Object.hasOwn(object, key) && object[key] !== undefined) {
        usedColumns[key] = columns[key]
        break
      }
    }
  }
  return usedColumns
}

export function pushStringChunk(chunks: SQLChunk[], sql: string) {
  const lastChunk = chunks.at(-1)
  if (lastChunk instanceof StringChunk) {
    lastChunk.value.push(sql)
  } else {
    chunks.push(new StringChunk(sql))
  }
}
