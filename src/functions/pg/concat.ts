import { sql, SQL } from 'drizzle-orm'
import { toSQL } from 'drizzle-plus'
import { SQLValue } from 'drizzle-plus/types'

/**
 * Concatenates two or more strings. If an argument is null, it's treated as an
 * empty string.
 *
 * @param args - The strings to concatenate.
 * @returns The concatenated string.
 */
export function concat(
  ...args: [
    SQLValue<string | null>,
    SQLValue<string | null>,
    ...SQLValue<string | null>[],
  ]
): SQL<string> {
  return sql`concat(${sql.join(args.map(toSQL), sql`, `)})`
}
