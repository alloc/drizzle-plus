import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Rounds a numeric value to specified decimal places. By default, rounds to the
 * nearest integer.
 *
 * @param value - The number to round.
 * @param decimals - The number of decimal places (optional).
 * @returns The rounded number.
 */
export function round<T extends number | null>(
  value: SQLExpression<T>,
  decimals?: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return decimals ? sql`round(${value}, ${decimals})` : sql`round(${value})`
}
