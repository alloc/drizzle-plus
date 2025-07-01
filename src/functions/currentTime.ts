import { sql, SQL } from 'drizzle-orm'

/**
 * Returns the current time, without any date component.
 *
 * **Note:** Check your dialect's documentation to know if the timestamp is
 * local or UTC.
 */
export function currentTime() {
  return sql.raw('current_time') as SQL<string>
}
