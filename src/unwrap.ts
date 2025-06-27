import type { AnyQuery, QueryToSQL } from './types'
import { getSelectedFields, getSQL } from './utils'

/**
 * Convert a subquery to its raw SQL, preserving its result type. Note
 * that the subquery must have exactly one column.
 */
export function unwrap<T extends AnyQuery>(subquery: T) {
  const selectedFields = getSelectedFields(subquery)
  if (Object.keys(selectedFields).length !== 1) {
    throw new Error('Subquery must have exactly one column')
  }
  return getSQL(subquery) as QueryToSQL<T, { unwrap: true }>
}
