import { SQL, sql } from 'drizzle-orm'
import { toSQL } from '../syntax/toSQL'
import { SQLValue } from '../types'

/**
 * Raises a number to the power of another.
 *
 * @param base - The base number.
 * @param exponent - The exponent number.
 * @returns The result of the power calculation.
 */
export function power<T extends number | null>(
  base: SQLValue<T>,
  exponent: SQLValue<T>
): SQL<number | Extract<T, null>> {
  return sql`power(${toSQL(base)}, ${toSQL(exponent)})`
}
