import { sql, SQL } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from 'drizzle-plus/types'

/**
 * Performs a **case-sensitive** search for the first occurrence of a substring
 * in a string.
 *
 * @param string - The string to search in.
 * @param substring - The substring to search for.
 * @returns The 1-based offset of the first occurrence of the substring in the
 * string, or `0` if the substring is not found.
 */
export function instr<
  TString extends SQLValue<string | null>,
  TSubstring extends SQLValue<string | null>,
>(
  string: TString,
  substring: TSubstring
): SQL<number | InferSQLNull<TString | TSubstring>> {
  return sql`instr(${string}, ${substring})`
}
