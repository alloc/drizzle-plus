import { SQL, sql } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from '../types'

/**
 * Raises a number to the power of another.
 */
export function power<
  TBase extends SQLValue<number | null>,
  TExponent extends SQLValue<number | null>,
>(
  base: TBase,
  exponent: TExponent
): SQL<number | InferSQLNull<TBase | TExponent>> {
  return sql`power(${base}, ${exponent})`
}
