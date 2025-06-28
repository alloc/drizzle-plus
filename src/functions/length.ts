import { sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the length of a string.
 *
 * @param value - The string to get the length of.
 * @returns The length of the string.
 */
export function length<T extends string | null>(value: SQLExpression<T>) {
  return sql<number | Extract<T, null>>`length(${value})`
}
