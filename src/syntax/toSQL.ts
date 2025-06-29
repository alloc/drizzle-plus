import { Column, is, SQL } from 'drizzle-orm'
import { SQLExpression } from '../types'
import { literal } from './literal'

/**
 * Accepts any kind of value and returns a `SQLWrapper` instance. If a constant
 * is passed, it is wrapped with the `literal()` function. Otherwise, the value
 * is returned as is.
 *
 * This function is useful in cases where a constant value is permitted, but so
 * is a SQL expression. It avoids using a query parameter for constant numbers
 * and booleans, while still escaping strings to prevent SQL injection.
 *
 * @param value - The value to coerce.
 * @returns A `SQLWrapper` instance.
 */
export function toSQL<T>(
  value: T
): T extends SQLExpression<unknown> ? T : SQL<T> {
  return (
    is(value, SQL) || is(value, SQL.Aliased) || is(value, Column)
      ? value
      : literal(value)
  ) as any
}
