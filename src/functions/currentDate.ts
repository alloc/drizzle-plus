import { StringChunk } from 'drizzle-orm'
import { Timestamp } from '../sql/timestamp'

/**
 * Returns the current date, without any time component.
 *
 * **Note:** Check your dialect's documentation to know if the date is local or
 * UTC.
 *
 * **Note 2:** There are no safeguards against inserting a date string into a
 * column that expects a timestamp.
 *
 * @example
 * ```ts
 * import { currentDate } from 'drizzle-plus'
 *
 * const today = currentDate()
 * // => Timestamp<string>
 *
 * today.toDate()
 * // => SQL<Date>
 * ```
 */
export function currentDate() {
  return new Timestamp<string>([new StringChunk('current_date')])
}
