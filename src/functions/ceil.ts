import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the smallest integer greater than or equal to a number.
 *
 * @param value - The number to get the ceiling of.
 * @returns The ceiling value.
 */
export function ceil<T extends number | null>(
  value: SQLExpression<T>
): SQL<number | Extract<T, null>> {
  return sql`ceil(${value})`
}
