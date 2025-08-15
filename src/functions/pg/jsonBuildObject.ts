import { sql, type DriverValueDecoder } from 'drizzle-orm'
import type { AnySelectQuery, ToJsonObject } from 'drizzle-plus/types'
import {
  buildJsonProperties,
  createJsonObjectDecoder,
} from 'drizzle-plus/utils'

/**
 * Build a JSON object from the selected fields of a given subquery. You may
 * pass a plain object instead, in which case its values can be any valid SQL
 * expression.
 */
export function jsonBuildObject<
  T extends AnySelectQuery | Record<string, unknown>,
>(subquery: T) {
  const decoders = new Map<string, DriverValueDecoder<any, any>>()
  const properties = buildJsonProperties(subquery, decoders)
  return sql`jsonb_build_object(${properties})`.mapWith(
    createJsonObjectDecoder(decoders)
  ) as ToJsonObject<T>
}
