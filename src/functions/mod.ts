import { SQL, sql } from 'drizzle-orm'
import { SQLValue } from '../types'

/**
 * Returns the remainder of a division operation.
 *
 * @param dividend - The number to be divided.
 * @param divisor - The number to divide by.
 * @returns The remainder.
 */
export function mod<T extends number | null>(
  dividend: SQLValue<T>,
  divisor: SQLValue<T>
): SQL<number | Extract<T, null>> {
  return sql`mod(${dividend}, ${divisor})`
}
