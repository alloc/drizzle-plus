import { SQL, sql } from 'drizzle-orm'
import { InferSQLNull, SQLValue } from '../types'

/**
 * Extracts a substring from a string. The start position is 1-based. If no
 * length is specified, the substring extends to the end of the string.
 */
export function substring<
  TInput extends SQLValue<string | null>,
  TPosition extends SQLValue<number | null>,
>(
  value: TInput,
  start: TPosition,
  length?: TPosition
): SQL<string | InferSQLNull<TInput | TPosition>> {
  return length !== undefined
    ? sql`substring(${value} from ${start} for ${length})`
    : sql`substring(${value} from ${start})`
}
