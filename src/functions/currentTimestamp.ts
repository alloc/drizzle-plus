import { StringChunk } from 'drizzle-orm'
import { Timestamp } from '../sql/timestamp'

/**
 * Returns the current timestamp.
 *
 * **Note:** Check your dialect's documentation to know if the timestamp is
 * local or UTC.
 */
export function currentTimestamp() {
  return new Timestamp<string>([new StringChunk('current_timestamp')])
}
