import { sql } from 'drizzle-orm'
import { toSQL } from '../syntax/toSQL'
import { SQLValue } from '../types'

/**
 * Returns the first non-null value in a list of arguments.
 *
 * @param args - The arguments to coalesce.
 * @returns The first non-null value.
 */
export function coalesce<T, U>(
  ...args: [...SQLValue<T | null>[], SQLValue<U>]
) {
  return sql<T | U>`coalesce(${sql.join(args.map(toSQL), sql`, `)})`
}
