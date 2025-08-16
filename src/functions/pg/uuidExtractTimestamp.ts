import { SQLChunk, StringChunk } from 'drizzle-orm'
import { SQLTimestamp } from 'drizzle-plus'
import { InferSQLNull, SQLValue } from 'drizzle-plus/types'

/**
 * Extract the timestamp from a UUID v1 or v7.
 *
 * @returns a `SQLTimestamp` instance, which can be used in a raw SQL query.
 */
export function uuidExtractTimestamp<T extends SQLValue<string | null>>(
  uuid: T
): SQLTimestamp<string | InferSQLNull<T>> {
  return new SQLTimestamp([
    new StringChunk('uuid_extract_timestamp('),
    uuid as SQLChunk,
    new StringChunk(')'),
  ])
}
