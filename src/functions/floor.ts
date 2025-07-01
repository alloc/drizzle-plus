import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the largest integer less than or equal to a number.
 *
 * @param value - The number to get the floor of.
 * @returns The floor value.
 */
export function floor<T extends number | null>(
  value: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return sql`floor(${value})`
}
