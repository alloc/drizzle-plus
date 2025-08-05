import { QueryPromise, sql } from 'drizzle-orm'
import type { AnyQuery, QueryToSQL, SQLExpression } from '../types'
import { buildRelationalQuery, getDecoder, getSQL } from '../utils'

/**
 * Wrap a subquery with parentheses and decode the result.
 *
 * **Please note** that the subquery must have exactly one column.
 */
export function nest<T extends AnyQuery>(subquery: T) {
  if (subquery instanceof QueryPromise) {
    const builtQuery = buildRelationalQuery(subquery)

    if (builtQuery.selection.length === 1) {
      const { field } = builtQuery.selection[0]

      return sql`(${builtQuery.sql})`.mapWith(result => {
        return getDecoder(field as SQLExpression).mapFromDriverValue(result)
      }) as QueryToSQL<T, { scalar: true }>
    }
  } else {
    const { selectedFields } = subquery._
    const keys = Object.keys(selectedFields)

    if (keys.length === 1) {
      const field = selectedFields[keys[0] as string]

      return sql`(${getSQL(subquery)})`.mapWith(result => {
        return getDecoder(field as SQLExpression).mapFromDriverValue(result)
      }) as QueryToSQL<T, { scalar: true }>
    }
  }

  throw new Error('Subquery must have exactly one column')
}
