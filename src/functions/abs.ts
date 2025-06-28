import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the absolute value of a number.
 *
 * @param value - The number to get the absolute value of.
 * @returns The absolute value.
 */
export function abs<T extends number | null>(
  value: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return sql`abs(${value})`
}
