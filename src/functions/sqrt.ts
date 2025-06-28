import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the square root of a number.
 *
 * @param value - The number to get the square root of.
 * @returns The square root.
 */
export function sqrt<T extends number | null>(
  value: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return sql`sqrt(${value})`
}
