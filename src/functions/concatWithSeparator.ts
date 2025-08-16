import { sql, SQL } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from 'drizzle-plus/types'
import { toSQL } from '../syntax/toSQL'

/**
 * Concatenates two or more strings with the given separator. Null values are
 * skipped, except when the separator is null, in which case the result is null.
 */
export function concatWithSeparator<TSeparator extends SQLValue<string | null>>(
  ...args: [separator: TSeparator, ...SQLValue<string | null>[]]
): SQL<string | InferSQLNull<TSeparator>> {
  return sql`concat_ws(${sql.join(args.map(toSQL), sql`, `)})`
}
