import { sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Removes leading and trailing spaces from a string.
 *
 * @param value - The string to trim.
 * @returns The trimmed string.
 */
export function trim<T extends string | null>(value: SQLExpression<T>) {
  return sql<T>`trim(${value})`
}
