import { SQL, sql } from 'drizzle-orm'
import { SQLValue } from '../types'

/**
 * Extracts a substring from a string.
 *
 * @param value - The string to extract from.
 * @param start - The starting position (1-based).
 * @param length - The length of the substring (optional).
 * @returns The extracted substring.
 */
export function substring<
  TInput extends string | null,
  TPosition extends number | null,
>(
  value: SQLValue<TInput>,
  start: SQLValue<TPosition>,
  length?: SQLValue<TPosition>
): SQL<string | Extract<TInput | TPosition, null>> {
  return length !== undefined
    ? sql`substring(${value}, ${start}, ${length})`
    : sql`substring(${value}, ${start})`
}
