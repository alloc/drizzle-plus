import { sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

/**
 * Returns the smallest integer greater than or equal to a number.
 */
export function ceil<T extends SQLExpression<number | null>>(value: T) {
  return sql<SQLResult<T>>`ceil(${value})`
}
