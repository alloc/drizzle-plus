import { gte, SQL } from 'drizzle-orm'
import { nest } from 'drizzle-plus'
import 'drizzle-plus/sqlite/count'
import { getDialect } from 'drizzle-plus/utils'
import { db } from './config/client'
import { userView } from './config/schema'

describe('count', () => {
  test('SQL output', () => {
    const query = db.query.user.count()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "select count(*) AS "count" from "user" as "dp0"",
      }
    `)

    const query2 = db.query.user.count({
      id: { gt: 100 },
    })

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
        ],
        "sql": "select count(*) AS "count" from "user" as "dp0" where "dp0"."id" > ?",
      }
    `)
  })

  test('with the nest() helper', async () => {
    const query = db.query.user.count()

    const nestedQuery = nest(query)
    expect(nestedQuery).toBeInstanceOf(SQL)

    expect(getDialect(query).sqlToQuery(nestedQuery)).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "(select count(*) AS "count" from "user" as "dp0")",
      }
    `)

    expect(await query).toEqual(0)
  })

  test('with relation', () => {
    const query = db.query.user.count({
      emails: true,
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "select count(*) AS "count" from "user" as "dp0" where exists (select * from "user_email" as "f0" where "dp0"."id" = "f0"."userId" limit 1)",
      }
    `)
  })

  test('on view', async () => {
    const expectedCount = await db.$count(userView, gte(userView.age, 30))
    const query = db.query.userView.count({ age: { gte: 30 } })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          30,
        ],
        "sql": "select count(*) AS "count" from "user_view" as "dp0" where "dp0"."age" >= ?",
      }
    `)
    expect(await query).toBe(expectedCount)
  })
})
