import { SQL, sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns `NULL` if two expressions are equal, otherwise returns the first expression.
 *
 * @param expression1 - The first expression.
 * @param expression2 - The second expression.
 * @returns `NULL` if expressions are equal, otherwise the first expression.
 */
export function nullif<T>(
  expression1: SQLExpression<T>,
  expression2: SQLExpression<unknown>
): SQL<T | null> {
  return sql`nullif(${expression1}, ${expression2})`
}
