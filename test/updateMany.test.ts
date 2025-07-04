import { sql } from 'drizzle-orm'
import { upper } from 'drizzle-plus'
import 'drizzle-plus/sqlite/updateMany'
import { db } from './config/client'

describe('updateMany', () => {
  test('basic update with returning', () => {
    const query = db.query.user.updateMany({
      set: {
        name: 'Gregory',
        age: 30,
      },
      returning: user => ({
        id: true,
        name: upper(user.name),
        random: sql<number>`random()`,
      }),
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          "Gregory",
          30,
        ],
        "sql": "update "user" set "name" = ?, "age" = ? returning "id", upper("name"), random()",
      }
    `)
  })

  test('update with where clause', () => {
    const query = db.query.user.updateMany({
      set: {
        handle: 'born_in_2004',
      },
      where: {
        age: 21,
      },
      returning: {
        id: true,
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          "born_in_2004",
          21,
        ],
        "sql": "update "user" set "handle" = ? where "user"."age" = ? returning "id"",
      }
    `)
  })

  test('update with orderBy and limit', () => {
    const query = db.query.user.updateMany({
      set: {
        age: 30,
      },
      orderBy: {
        id: 'asc',
        age: 'desc',
      },
      limit: 5,
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          30,
          5,
        ],
        "sql": "update "user" set "age" = ? order by "user"."id" asc, "user"."age" desc limit ?",
      }
    `)
  })

  test('update with returning all columns', async () => {
    const query = db.query.user.updateMany({
      set: {
        handle: '',
      },
      returning: user => user,
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          "",
        ],
        "sql": "update "user" set "handle" = ? returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('update with relations filter', async () => {
    const query = db.query.user.updateMany({
      set: {
        handle: '',
      },
      where: {
        emails: {
          label: { isNotNull: true },
        },
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          "",
        ],
        "sql": "update "user" set "handle" = ? where exists (select * from "user_email" as "f0" where ("user"."id" = "f0"."userId" and "f0"."label" is not null) limit 1)",
      }
    `)
  })

  test('update with empty returning object', async () => {
    const query = db.query.user.updateMany({
      set: {
        age: 30,
      },
      // Same behavior as undefined.
      returning: {},
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          30,
        ],
        "sql": "update "user" set "age" = ?",
      }
    `)
  })
})
