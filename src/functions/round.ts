import { SQL, sql } from 'drizzle-orm'
import { SQLValue } from '../types'

/**
 * Rounds a numeric value to specified decimal places. By default, rounds to the
 * nearest integer.
 *
 * @param value - The number to round.
 * @param decimals - The number of decimal places (optional).
 * @returns The rounded number.
 */
export function round<T extends number | null>(
  value: SQLValue<T>,
  decimals?: SQLValue<T>
): SQL<number | Extract<T, null>> {
  return decimals ? sql`round(${value}, ${decimals})` : sql`round(${value})`
}
