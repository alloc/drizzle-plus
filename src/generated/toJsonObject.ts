import { noopDecoder, SQL, sql, type DriverValueDecoder } from 'drizzle-orm'
import type { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import type {
  AnySelectQuery,
  QueryToSQL,
  SQLExpression,
} from 'drizzle-plus/types'
import { getDecoder, getSelectedFields } from 'drizzle-plus/utils'
import { isPlainObject } from 'radashi'

export type ToJsonObject<T extends AnySelectQuery | Record<string, unknown>> =
  T extends AnySelectQuery ? QueryToSQL<T> : SQL<SelectResultFields<T>>

/**
 * Create a `json_build_object(…)` expression from the selected fields
 * of a given subquery. This expression can be used in a
 * `db.select({…})` call, but you need to join it with the subquery.
 *
 * Alternatively, you may pass a plain object to this function and its
 * properties will be used in a `json_build_object(…)` expression.
 */
export function toJsonObject<
  T extends AnySelectQuery | Record<string, unknown>,
>(subquery: T) {
  const properties = sql.empty()
  const decoders = new Map<string, DriverValueDecoder<any, any>>()

  Object.entries(
    isRawSelection(subquery) ? subquery : getSelectedFields(subquery)
  ).forEach(([key, column], index) => {
    const decoder = getDecoder(column as SQLExpression<any>)
    if (decoder !== noopDecoder) {
      decoders.set(key, decoder)
    }
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
  })

  return sql`json_build_object(${properties})`.mapWith(jsonString => {
    const data: any = JSON.parse(jsonString)
    for (const [key, decoder] of decoders) {
      data[key] = decoder.mapFromDriverValue(data[key])
    }
    return data
  }) as ToJsonObject<T>
}

function isRawSelection(
  arg: AnySelectQuery | Record<string, unknown>
): arg is Record<string, unknown> {
  return isPlainObject(arg)
}
