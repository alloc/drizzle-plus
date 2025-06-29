import { sql, SQL } from 'drizzle-orm'
import { SQLExpression, SQLValue } from 'drizzle-plus/types'

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
  return sql`concat(${sql.join(
    args.map(arg =>
      arg === null || typeof arg === 'string'
        ? sql`${arg}`
        : (arg as SQLExpression)
    ),
    sql`, `
  )})`
}
