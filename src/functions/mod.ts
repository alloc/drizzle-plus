import { SQL, sql } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from '../types'

/**
 * Returns the remainder of a division operation.
 */
export function mod<
  TDividend extends SQLValue<number | null>,
  TDivisor extends SQLValue<number | null>,
>(
  dividend: TDividend,
  divisor: TDivisor
): SQL<number | InferSQLNull<TDividend | TDivisor>> {
  return sql`mod(${dividend}, ${divisor})`
}
