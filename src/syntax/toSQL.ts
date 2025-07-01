import { isSQLWrapper, sql, SQL, SQLWrapper } from 'drizzle-orm'

export type ToSQL<T> = T extends SQLWrapper
  ? T
  : T extends number | boolean | null
    ? SQL<T>
    : SQL<string>

/**
 * Coerce a JavaScript value to a parameter binding, while `SQLWrapper`
 * instances are passed through.
 *
 * @param value - The value to coerce.
 * @returns A `SQLWrapper` instance.
 */
export function toSQL<T>(value: T): ToSQL<T> {
  return (isSQLWrapper(value) ? value : sql`${value}`) as ToSQL<T>
}
