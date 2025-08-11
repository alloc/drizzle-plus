import { DrizzleTypeError } from 'drizzle-orm'
import { SQL, sql } from 'drizzle-orm/sql'
import { SQLValue } from 'drizzle-plus/types'
import type { InferCastResult, SQLType } from './types'

/**
 * Cast a value to a specific type.
 *
 * ⚠️ Never pass user input as the `type` argument unless you've thoroughly
 * validated it.
 */
export function cast<
  const TData,
  const TDataType extends SQLType | (string & {}),
>(
  value: SQLValue<TData>,
  type: (TDataType | SQLType) &
    (string extends NoInfer<TDataType>
      ? DrizzleTypeError<'DANGER: Do not pass user input as the type argument of the cast() function.'>
      : unknown)
): InferCastResult<TDataType> extends infer TResult
  ? SQL<TData extends null ? null : TData extends TResult ? TData : TResult>
  : never {
  return sql`cast(${value} as ${sql.raw(type)})` as any
}
