import { sql } from 'drizzle-orm'
import { SQLResult, SQLValue } from '../types'

/**
 * Returns `NULL` if two expressions are equal, otherwise returns the first
 * expression.
 */
export function nullif<T extends SQLValue<unknown>>(
  expression1: T,
  expression2: unknown
) {
  return sql<SQLResult<T>>`nullif(${expression1}, ${expression2})`
}
