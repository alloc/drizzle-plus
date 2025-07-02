import { sql, SQL } from 'drizzle-orm'
import { SQLValue } from 'drizzle-plus/types'

/**
 * Performs a **case-insensitive** search for the first occurrence of a
 * substring in a string.
 *
 * @param substring - The substring to search for.
 * @param string - The string to search in.
 * @returns The 1-based offset of the first occurrence of the substring in the
 * string, or `0` if the substring is not found.
 */
export function position<T extends string | null>(
  substring: SQLValue<T>,
  string: SQLValue<T>
): SQL<number | Extract<T, null>> {
  return sql`position(${substring} in ${string})`
}
