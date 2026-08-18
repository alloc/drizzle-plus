import { sql, SQL } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from 'drizzle-plus/types'

/**
 * Searches for the first occurrence of a substring in a string according to
 * the collation rules of the arguments, which may be case-sensitive or
 * case-insensitive.
 *
 * @param substring - The substring to search for.
 * @param string - The string to search in.
 * @returns The 1-based offset of the first occurrence of the substring in the
 * string, or `0` if the substring is not found.
 */
export function position<
  TSubstring extends SQLValue<string | null>,
  TString extends SQLValue<string | null>,
>(
  substring: TSubstring,
  string: TString
): SQL<number | InferSQLNull<TSubstring | TString>> {
  return sql`position(${substring} in ${string})`
}
