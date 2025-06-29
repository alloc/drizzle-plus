import { SQL, sql } from 'drizzle-orm'
import { SQLExpression, SQLValue } from '../types'

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
  TRange extends number | null,
>(
  value: SQLExpression<TInput>,
  start: SQLValue<TRange> | TRange,
  length?: SQLValue<TRange> | TRange
): SQL<string | Extract<TInput | TRange, null>> {
  return length !== undefined
    ? sql`substring(${value}, ${start}, ${length})`
    : sql`substring(${value}, ${start})`
}
