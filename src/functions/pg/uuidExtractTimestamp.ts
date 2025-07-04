import { SQLChunk, StringChunk } from 'drizzle-orm'
import { SQLTimestamp } from 'drizzle-plus'
import { SQLValue } from 'drizzle-plus/types'

/**
 * Extract the timestamp from a UUID v1 or v7.
 *
 * @returns a `SQLTimestamp` instance, which can be used in a raw SQL query.
 */
export function uuidExtractTimestamp<T extends string | null>(
  uuid: SQLValue<T>
): SQLTimestamp<string | Extract<T, null>> {
  return new SQLTimestamp([
    new StringChunk('uuid_extract_timestamp('),
    uuid as SQLChunk,
    new StringChunk(')'),
  ])
}
