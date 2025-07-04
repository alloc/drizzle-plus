import { SQL, sql } from 'drizzle-orm'
import { SQLValue } from 'drizzle-plus/types'

/**
 * Generate a version 7 (time-ordered) UUID. The timestamp is computed using
 * UNIX timestamp with millisecond precision + sub-millisecond timestamp +
 * random.
 *
 * @param shift - An interval to shift the UUID's timestamp by. (e.g. `'1 day'`)
 */
export function uuidv7(shift?: SQLValue<string>): SQL<string> {
  return sql`uuidv7(${shift})`
}
