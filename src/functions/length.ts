import { sql } from 'drizzle-orm'
import { InferSQLNull, SQLExpression } from '../types'

/**
 * Returns the length of a string.
 */
export function length<T extends SQLExpression<string | null>>(value: T) {
  return sql<number | InferSQLNull<T>>`length(${value})`
}
