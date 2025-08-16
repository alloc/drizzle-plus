import { sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

/**
 * Returns the square root of a number.
 */
export function sqrt<T extends SQLExpression<number | null>>(value: T) {
  return sql<SQLResult<T>>`sqrt(${value})`
}
