import { SQL, sql } from 'drizzle-orm'
import { SQLExpression, SQLResult } from '../types'

type UppercaseOrNull<T extends string | null> = T extends string
  ? Uppercase<T>
  : null

/**
 * Converts a string to uppercase.
 */
export function upper<T extends SQLExpression<string | null>>(
  value: T
): SQL<UppercaseOrNull<SQLResult<T>>> {
  return sql`upper(${value})`
}
