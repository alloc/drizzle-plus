import { sql, SQL } from 'drizzle-orm'
import { SQLValue } from 'drizzle-plus/types'
import { toSQL } from '../syntax/toSQL'

/**
 * Concatenates two or more strings with the given separator. Null values are
 * skipped, except when the separator is null, in which case the result is null.
 */
export function concatWithSeparator<TSeparator extends string | null>(
  ...args: [separator: SQLValue<TSeparator>, ...SQLValue<string | null>[]]
): SQL<string | Extract<TSeparator, null>> {
  return sql`concat_ws(${sql.join(args.map(toSQL), sql`, `)})`
}
