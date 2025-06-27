import { sql } from 'drizzle-orm'
import type { AnyQuery, QueryToSQL } from './types'
import { getDecoder, getSelectedFields, getSQL } from './utils'

/**
 * Wrap a subquery with parentheses and decode the result.
 *
 * **Please note** that the subquery must have exactly one column.
 */
export function nest<T extends AnyQuery>(subquery: T) {
  const selectedFields = getSelectedFields(subquery)
  const keys = Object.keys(selectedFields)
  if (keys.length !== 1) {
    throw new Error('Subquery must have exactly one column')
  }
  return sql`(${getSQL(subquery)})`.mapWith(result => {
    const decoder = getDecoder(selectedFields[keys[0] as string] as any)
    return decoder.mapFromDriverValue(result)
  }) as QueryToSQL<T, { unwrap: true }>
}
