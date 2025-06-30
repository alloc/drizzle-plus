import { gt, sql } from 'drizzle-orm'
import { caseWhen } from 'drizzle-plus'
import { db } from './config/client'
import * as schema from './config/schema'

describe('caseWhen', () => {
  test('SQL output', () => {
    const query = db
      .select({
        test: caseWhen(sql`true`, 1).else(2),
      })
      .from(schema.user)

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          1,
          2,
        ],
        "sql": "select CASE WHEN true THEN ? ELSE ? END from "user"",
      }
    `)

    const query2 = db
      .select({
        test: caseWhen(gt(schema.user.id, 100), 1)
          .when(gt(schema.user.id, 200), 2)
          .elseNull(),
      })
      .from(schema.user)

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          1,
          200,
          2,
        ],
        "sql": "select CASE WHEN "user"."id" > ? THEN ? WHEN "user"."id" > ? THEN ? END from "user"",
      }
    `)
  })
})
