import {
  BuildRelationalQueryResult,
  Column,
  getTableColumns,
  is,
  noopDecoder,
  QueryPromise,
  SelectedFieldsOrdered,
  sql,
  SQL,
  SQLChunk,
  StringChunk,
  Table,
  type DBQueryConfig,
  type DriverValueDecoder,
} from 'drizzle-orm'
import { isPlainObject } from 'radashi'
import { toSelection } from './syntax/toSelection'
import type {
  AnyDialect,
  AnyQuery,
  AnySelectQuery,
  DecodedFields,
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

export function buildJsonProperties(
  input: AnySelectQuery | Record<string, unknown>,
  decoders?: Map<string, DriverValueDecoder<any, any>>
): SQL {
  const subquery = isPlainObject(input) ? null : (input as AnySelectQuery)
  const properties = sql.empty()

  let fields: Record<string, unknown>
  let alias: string | undefined
  if (isPlainObject(input)) {
    fields = toSelection(input as Record<string, unknown>)
  } else {
    fields = getSelectedFields(subquery as AnySelectQuery)
    alias = (subquery as AnySelectQuery)._.alias
  }

  Object.entries(fields).forEach(([field, value], index) => {
    if (index > 0) {
      properties.append(sql.raw(','))
    }

    const sanitizedField = field.replace(/[^a-z0-9_-]/gi, '')
    properties.append(sql.raw(`'${sanitizedField}', `))

    if (is(value, Column) || is(value, SQL.Aliased)) {
      properties.append(new SQL([value]))
    } else if (alias) {
      properties.append(
        sql`${sql.identifier(alias)}.${sql.identifier(sanitizedField)}`
      )
    } else {
      properties.append(value as SQL)
    }

    if (decoders) {
      const decoder = getDecoder(value as SQLExpression<any>)
      if (decoder !== noopDecoder) {
        decoders.set(field, decoder)
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

// Adapted from https://github.com/drizzle-team/drizzle-orm/blob/109ccd34b549030e10dd9cd27e41641d0878a856/drizzle-orm/src/utils.ts#L74
export function orderSelectedFields<TColumn extends Column>(
  fields: Record<string, unknown>,
  pathPrefix?: string[]
) {
  const result: SelectedFieldsOrdered<Column> = []
  for (const name in fields) {
    if (!Object.prototype.hasOwnProperty.call(fields, name)) continue
    if (typeof name !== 'string') continue

    const field = fields[name]
    const newPath = pathPrefix ? [...pathPrefix, name] : [name]
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field })
    } else {
      const orderedFields = orderSelectedFields(
        is(field, Table)
          ? getTableColumns(field)
          : isPlainObject(field)
            ? (field as Record<string, unknown>)
            : {},
        newPath
      )
      for (const field of orderedFields) {
        result.push(field)
      }
    }
  }
  return result as SelectedFieldsOrdered<TColumn>
}

export function mapSelectedFieldsToDecoders<TColumn extends Column>(
  orderedFields: SelectedFieldsOrdered<TColumn>
) {
  const decodedFields: DecodedFields = Object.create(null)
  for (const { path, field } of orderedFields) {
    const name = is(field, SQL.Aliased)
      ? field.fieldAlias
      : path[path.length - 1]
    decodedFields[name] = getDecoder(field)
  }
  return decodedFields
}
