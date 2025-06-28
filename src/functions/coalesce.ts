import { sql } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Returns the first non-null value in a list of arguments.
 *
 * @param args - The arguments to coalesce.
 * @returns The first non-null value.
 */
export function coalesce<T>(
  ...args: [...SQLExpression<T | null>[], SQLExpression<T>]
) {
  return sql<T>`coalesce(${sql.join(args, sql`, `)})`
}
