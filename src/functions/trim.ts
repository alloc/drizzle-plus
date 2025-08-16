import { sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

/**
 * Removes leading and trailing spaces from a string.
 */
export function trim<T extends SQLExpression<string | null>>(value: T) {
  return sql<SQLResult<T>>`trim(${value})`
}
