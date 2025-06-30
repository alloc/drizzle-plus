import { eq, noopDecoder, sql, SQL } from 'drizzle-orm'
import { nest } from 'drizzle-plus'
import 'drizzle-plus/sqlite/count'
import { getDecoder, getDialect } from 'drizzle-plus/utils'
import { db } from './config/client'
import * as schema from './config/schema'

describe('nest', () => {
  test('with a db.query.user.findFirst() query', () => {
    const query = db.query.user.findFirst({
      columns: {},
      extras: {
        id: user => sql`${user.id}`.mapWith(String),
      },
    })

    const nestedQuery = nest(query)
    expect(nestedQuery).toBeInstanceOf(SQL)

    // Verify that the query is wrapped in parentheses and parameter bindings
    // are preserved.
    expect(getDialect(query).sqlToQuery(nestedQuery)).toMatchInlineSnapshot(`
      {
        "params": [
          1,
        ],
        "sql": "(select ("d0"."id") as "id" from "user" as "d0" limit ?)",
        "typings": [
          "none",
        ],
      }
    `)

    const decoder = getDecoder(nestedQuery)
    expect(decoder).not.toBe(noopDecoder)

    // Verify that column decoders are being applied.
    expect(decoder.mapFromDriverValue(1)).toEqual('1')
  })

  test('with a db.select() query', () => {
    const query = db
      .select({ id: sql`${schema.user.id}`.mapWith(String) })
      .from(schema.user)
      .where(eq(schema.user.name, 'John'))

    const nestedQuery = nest(query)
    expect(nestedQuery).toBeInstanceOf(SQL)

    // Verify that the query is wrapped in parentheses and parameter bindings
    // are preserved.
    expect(getDialect(query).sqlToQuery(nestedQuery)).toMatchInlineSnapshot(`
      {
        "params": [
          "John",
        ],
        "sql": "(select "id" from "user" where "user"."name" = ?)",
        "typings": [
          "none",
        ],
      }
    `)

    const decoder = getDecoder(nestedQuery)
    expect(decoder).not.toBe(noopDecoder)

    // Verify that column decoders are being applied.
    expect(decoder.mapFromDriverValue(1)).toEqual('1')
  })
})
