import {
  Column,
  ColumnsSelection,
  DrizzleError,
  FakePrimitiveParam,
  is,
  QueryPromise,
  SQL,
  sql,
} from 'drizzle-orm'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { RawFieldsToSelection } from 'drizzle-plus/types'
import { isDate } from 'radashi'
import { getSQL } from '../utils'

/**
 * Coerce a plain object with JavaScript values to a `db.select()` selection
 * object. Any objects within must be JSON-serializable.
 *
 * - `undefined` values are ignored
 * - primitive values (including `null`) are wrapped with `sql` template
 * - `Date` values are treated as ISO strings
 * - subqueries and `SQL` objects are preserved
 */
export function toSelection<T extends Record<string, unknown>>(
  fields: T,
  options?: { addAliases?: boolean }
): RawFieldsToSelection<T> {
  const selection: ColumnsSelection = {}
  for (const key in fields) {
    let value: any = fields[key]
    if (value === undefined) {
      continue
    }
    if (value === null) {
      value = sql`null`
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      value = sql.raw(String(value))
    } else if (typeof value !== 'object') {
      if (typeof value === 'function') {
        throw new DrizzleError({
          message: 'Function values are not allowed in a selection',
        })
      }
      value = new SQL([value as FakePrimitiveParam])
    } else if (!is(value, SQL)) {
      if (is(value, Column) || is(value, SQL.Aliased)) {
        // Note: This allows columns from any dialect.
        selection[key] = value
        continue // Skip aliasing.
      }
      if (is(value, QueryPromise) || is(value, TypedQueryBuilder<any>)) {
        value = getSQL(value)
      } else if (isDate(value)) {
        value = new SQL([value.toISOString() as FakePrimitiveParam])
      } else {
        value = new SQL([JSON.stringify(value) as FakePrimitiveParam])
      }
    }
    selection[key] = options?.addAliases ? value.as(key) : value
  }
  return selection as any
}
