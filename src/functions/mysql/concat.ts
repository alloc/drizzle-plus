import { sql, SQL } from 'drizzle-orm'
import { toSQL } from 'drizzle-plus'
import { SQLValue } from 'drizzle-plus/types'

/**
 * Concatenates two or more strings. If one of the arguments is null, the result
 * is null.
 *
 * @param args - The strings to concatenate.
 * @returns The concatenated string.
 */
export function concat<T extends string | null>(
  ...args: [SQLValue<T>, SQLValue<T>, ...SQLValue<T>[]]
): SQL<string | Extract<T, null>> {
  return sql`concat(${sql.join(args.map(toSQL), sql`, `)})`
}
