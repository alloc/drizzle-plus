import { gt } from 'drizzle-orm'
import { caseWhen, literal } from 'drizzle-plus'
import { db } from './config/client'
import * as schema from './config/schema'

describe('caseWhen', () => {
  test('SQL output', () => {
    const query = db
      .select({
        test: caseWhen(literal(true), literal(1)).else(literal(2)),
      })
      .from(schema.foo)

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "select CASE WHEN true THEN 1 ELSE 2 END from "foo"",
      }
    `)

    const query2 = db
      .select({
        test: caseWhen(gt(schema.foo.id, 100), literal(1))
          .when(gt(schema.foo.id, 200), literal(2))
          .elseNull(),
      })
      .from(schema.foo)

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          200,
        ],
        "sql": "select CASE WHEN "foo"."id" > ? THEN 1 WHEN "foo"."id" > ? THEN 2 END from "foo"",
      }
    `)
  })
})
