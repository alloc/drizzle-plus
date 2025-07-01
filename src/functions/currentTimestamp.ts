import { StringChunk } from 'drizzle-orm'
import { SQLTimestamp } from '../sql/timestamp'

/**
 * Returns the current timestamp (both date and time).
 *
 * **Note:** Check your dialect's documentation to know if the timestamp is
 * local or UTC.
 *
 * @example
 * ```ts
 * import { currentTimestamp } from 'drizzle-plus'
 *
 * const now = currentTimestamp()
 * // => SQLTimestamp<string>
 *
 * now.toDate()
 * // => SQL<Date>
 * ```
 */
export function currentTimestamp() {
  return new SQLTimestamp<string>([new StringChunk('current_timestamp')])
}
