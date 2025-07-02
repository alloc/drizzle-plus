import { sql, SQL } from 'drizzle-orm'
import { SQLExpression, SQLValue } from 'drizzle-plus/types'

/**
 * Concatenates two or more strings. If an argument is null, it's treated as an
 * empty string.
 *
 * @param args - The strings to concatenate.
 * @returns The concatenated string.
 */
export function concat(...args: SQLValue<string | null>[]): SQL<string> {
  return sql`concat(${sql.join(
    args.map(arg =>
      arg === null || typeof arg === 'string'
        ? sql`${arg}`
        : (arg as SQLExpression)
    ),
    sql`, `
  )})`
}
