import { SQL, sql } from 'drizzle-orm'
import { toSQL } from '../syntax/toSQL'
import { InferSQLNull, SQLResult } from '../types'

/**
 * Returns the first non-null value in a list of arguments.
 */
export function coalesce<T extends unknown[], U>(
  ...args: [...T, U]
): SQL<SQLResult<T[number] | U> | InferSQLNull<U>> {
  return sql`coalesce(${sql.join(args.map(toSQL), sql`, `)})`
}
