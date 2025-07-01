import { StringChunk } from 'drizzle-orm'
import { Timestamp } from '../sql/timestamp'

/**
 * Returns the current timestamp.
 *
 * **Note:** Check your dialect's documentation to know if the timestamp is
 * local or UTC.
 *
 * @example
 * ```ts
 * import { currentTimestamp } from 'drizzle-plus'
 *
 * const now = currentTimestamp()
 * // => Timestamp<string>
 *
 * now.toDate()
 * // => SQL<Date>
 * ```
 */
export function currentTimestamp() {
  return new Timestamp<string>([new StringChunk('current_timestamp')])
}
