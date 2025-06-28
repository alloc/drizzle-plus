import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Raises a number to the power of another.
 *
 * @param base - The base number.
 * @param exponent - The exponent number.
 * @returns The result of the power calculation.
 */
export function power<T extends number | null>(
  base: SQLExpression<T>,
  exponent: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return sql`power(${base}, ${exponent})`
}
