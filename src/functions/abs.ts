import { sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

/**
 * Returns the absolute value of a number.
 */
export function abs<T extends SQLExpression<number | null>>(value: T) {
  return sql<SQLResult<T>>`abs(${value})`
}
