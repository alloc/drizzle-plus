import { sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

/**
 * Returns the largest integer less than or equal to a number.
 */
export function floor<T extends SQLExpression<number | null>>(value: T) {
  return sql<SQLResult<T>>`floor(${value})`
}
