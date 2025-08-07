import {
  DriverValueDecoder,
  DrizzleError,
  getTableColumns,
  is,
  SQL,
  sql,
  SQLWrapper,
  Subquery,
  Table,
  View,
} from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { PgViewBase } from 'drizzle-orm/pg-core/view-base'
import type { RowToJson } from 'drizzle-plus/types'
import {
  getDecoder,
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'

/**
 * Convert a single row to a JSON object using PostgreSQL's `row_to_json`
 * function.
 *
 * If the input is an empty result set, the output will be `null`. Notably, the
 * `drizzle-plus` implementation doesn't include `null` in the return type, for
 * convenience. You should wrap `rowToJson` calls with a `coalesce` or
 * `caseWhen` call to handle the null case explicitly. If you're confident the
 * result set cannot be empty, then you can skip this step.
 *
 * If the input is a result set of potentially multiple rows, you should use
 * `jsonAgg(rowToJson(subquery))` instead. Otherwise, you'll get a database
 * error when this happens.
 */
export function rowToJson<T extends Subquery | Table | View | SQLWrapper>(
  subquery: T | SQLWrapper
): SQL<RowToJson<T>> {
  let fields: Record<string, unknown> | undefined
  let decoder:
    | DriverValueDecoder<unknown, Record<string, unknown> | null>
    | undefined

  if (is(subquery, PgTable)) {
    fields = getTableColumns(subquery)
  } else if (is(subquery, Subquery)) {
    if (!subquery._.alias) {
      throw new DrizzleError({
        message: 'Subquery must have an alias.',
      })
    }
    fields = subquery._.selectedFields
    subquery = new SQL([sql.identifier(subquery._.alias)]) as SQLWrapper
  } else if (is(subquery, PgViewBase)) {
    fields = subquery._.selectedFields
  }

  if (fields) {
    const orderedFields = orderSelectedFields(fields)
    const decodedFields = mapSelectedFieldsToDecoders(orderedFields)
    decoder = {
      mapFromDriverValue(row) {
        if (row) {
          for (const field in decodedFields) {
            row[field] = decodedFields[field].mapFromDriverValue(row[field])
          }
        }
        return row
      },
    }
  } else {
    decoder = getDecoder(subquery)
  }

  return sql`row_to_json(${subquery})`.mapWith(decoder) as SQL<RowToJson<T>>
}
