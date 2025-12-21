import 'drizzle-plus/sqlite/findManyAndCount'
import { db } from './config/client'

describe('findManyAndCount (SQL)', () => {
  test('SQL output', () => {
    const query = db.query.user.findManyAndCount()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [],
          "sql": "select count(*) AS "count" from "user"",
        },
        "findMany": {
          "params": [],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "user" as "d0"",
        },
      }
    `)

    const query2 = db.query.user.findManyAndCount({
      where: {
        id: { gt: 100 },
      },
    })

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [
            100,
          ],
          "sql": "select count(*) AS "count" from "user" where "user"."id" > ?",
          "typings": [
            "none",
          ],
        },
        "findMany": {
          "params": [
            100,
          ],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "user" as "d0" where "d0"."id" > ?",
          "typings": [
            "none",
          ],
        },
      }
    `)
  })
})
