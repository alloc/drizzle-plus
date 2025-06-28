import 'drizzle-plus/sqlite/count'
import { db } from './config/client'

describe('count', () => {
  test('SQL output', () => {
    const query = db.query.foo.count()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [],
        "sql": "select count(*) AS "count" from "foo"",
      }
    `)

    const query2 = db.query.foo.count({
      id: { gt: 100 },
    })

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
        ],
        "sql": "select count(*) AS "count" from "foo" where "foo"."id" > ?",
        "typings": [
          "none",
        ],
      }
    `)
  })
})
