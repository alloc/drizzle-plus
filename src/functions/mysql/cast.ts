import { DrizzleTypeError } from 'drizzle-orm'
import { SQL, sql } from 'drizzle-orm/sql'
import type { InferCastResult, SQLType } from './types'

/**
 * Cast a value to a specific type.
 *
 * ⚠️ Never pass user input as the `type` argument unless you've thoroughly
 * validated it.
 */
export function cast<const T extends SQLType | (string & {})>(
  value: unknown,
  type: (T | SQLType) &
    (string extends NoInfer<T>
      ? DrizzleTypeError<'DANGER: Do not pass user input as the type argument of the cast() function.'>
      : unknown)
): SQL<InferCastResult<T>> {
  return sql`cast(${value} as ${sql.raw(type)})` as any
}
