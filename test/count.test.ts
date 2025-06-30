import { SQL } from 'drizzle-orm'
import { nest } from 'drizzle-plus'
import 'drizzle-plus/sqlite/count'
import { getDialect } from 'drizzle-plus/utils'
import { db } from './config/client'

describe('count', () => {
  test('SQL output', () => {
    const query = db.query.user.count()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "select count(*) AS "count" from "user"",
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
        "sql": "select count(*) AS "count" from "user" where "user"."id" > ?",
        "typings": [
          "none",
        ],
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
        "sql": "(select count(*) AS "count" from "user")",
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
        "sql": "select count(*) AS "count" from "user" where exists (select * from "user_email" as "f0" where "user"."id" = "f0"."userId" limit 1)",
      }
    `)
  })
})
