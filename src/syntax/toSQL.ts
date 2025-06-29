import { isSQLWrapper, sql, SQL } from 'drizzle-orm'
import { SQLExpression } from '../types'

/**
 * Accepts any kind of value and returns a `SQLWrapper` instance. Strings are
 * escaped, constants are wrapped with `sql.raw()`, and objects are returned as
 * is.
 *
 * This function is useful in cases where a constant value is permitted, but so
 * is a SQL expression. It avoids using a query parameter for
 * numbers/booleans/null, while still escaping strings to prevent SQL injection.
 *
 * @param value - The value to coerce.
 * @returns A `SQLWrapper` instance.
 */
export function toSQL<T>(
  value: T
): T extends SQLExpression<unknown>
  ? T
  : T extends number | boolean | null
    ? SQL<T>
    : SQL<string> {
  return (isSQLWrapper(value) ? value : sql`${value}`) as any
}
