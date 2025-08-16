import { SQL, sql } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from '../types'

/**
 * Rounds a numeric value to specified decimal places. By default, rounds to the
 * nearest integer.
 */
export function round<
  TValue extends SQLValue<number | null>,
  TDecimals extends SQLValue<number | null>,
>(
  value: TValue,
  decimals?: TDecimals
): SQL<number | InferSQLNull<TValue | TDecimals>> {
  return decimals !== undefined
    ? sql`round(${value}, ${decimals})`
    : sql`round(${value})`
}
