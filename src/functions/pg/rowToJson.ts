import {
  DriverValueDecoder,
  getTableColumns,
  is,
  SQL,
  sql,
  SQLWrapper,
  Subquery,
} from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import type { AnyResultSet, RowToJson } from 'drizzle-plus/types'
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
export function rowToJson<T extends AnyResultSet | SQLWrapper>(
  subquery: T
): SQL<RowToJson<T>> {
  let row: SQLWrapper
  let fields: Record<string, unknown> | undefined
  let decoder:
    | DriverValueDecoder<unknown, Record<string, unknown> | null>
    | undefined

  if (is(subquery, PgTable)) {
    row = subquery
    fields = getTableColumns(subquery)
  } else if (is(subquery, TypedQueryBuilder<any>) || is(subquery, Subquery)) {
    row =
      is(subquery, Subquery) && subquery._.alias
        ? new SQL([sql.identifier(subquery._.alias)])
        : sql`(${subquery})`
    fields = subquery._.selectedFields
  } else {
    row = subquery
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
    decoder = getDecoder(row)
  }

  return sql`row_to_json(${row})`.mapWith(decoder) as RowToJson<T>
}
