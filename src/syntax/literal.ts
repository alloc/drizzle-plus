import { SQL, sql } from 'drizzle-orm'

/**
 * Wraps a constant value in a `SQL` object. Numbers, booleans, and null are
 * wrapped with `sql.raw()` while strings are escaped to prevent SQL injection.
 *
 * @param value - The value to wrap.
 * @returns A `SQL` object.
 */
export function literal<const T>(value: T): SQL<T> {
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return sql.raw(String(value)) as SQL<T>
  }
  return sql<T>`${value}`
}
