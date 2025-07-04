import { sql } from 'drizzle-orm'
import { upper } from 'drizzle-plus'
import 'drizzle-plus/sqlite/upsert'
import { db } from './config/client'

describe('upsert', () => {
  test('primary key + returning', async () => {
    const query = db.query.user.upsert({
      data: {
        id: 100,
        name: 'Gregory',
      },
      returning: {
        id: true,
        name: user => sql<string>`upper(${user.name})`,
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null) on conflict ("user"."id") do update set "name" = excluded."name" returning "id", upper("name")",
      }
    `)

    expect(await query).toMatchInlineSnapshot(`
      {
        "id": 100,
        "name": "GREGORY",
      }
    `)
  })

  test('composite primary key + no returning', async () => {
    const query = db.query.orderItem.upsert({
      data: {
        orderId: 100,
        productId: 200,
        quantity: 3,
      },
      returning: {},
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          200,
          3,
        ],
        "sql": "insert into "order_item" ("orderId", "productId", "quantity") values (?, ?, ?) on conflict ("order_item"."orderId", "order_item"."productId") do update set "quantity" = excluded."quantity"",
      }
    `)

    expect(await query).toMatchInlineSnapshot(`undefined`)
  })

  test('unique constraint', () => {
    const query = db.query.userEmail.upsert({
      data: {
        userId: 100,
        email: 'gregory@example.com',
        label: 'work',
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "gregory@example.com",
          "work",
        ],
        "sql": "insert into "user_email" ("userId", "email", "label") values (?, ?, ?) on conflict ("user_email"."userId", "user_email"."email") do update set "label" = excluded."label" returning "userId", "email", "label"",
      }
    `)
  })

  test('update a unique column through primary key', () => {
    const query = db.query.user.upsert({
      data: {
        handle: 'gregory',
        id: 100, // Property order is unimportant.
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "gregory",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, null, null, ?) on conflict ("user"."id") do update set "handle" = excluded."handle" returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('update through a unique column', () => {
    const query = db.query.user.upsert({
      data: {
        name: 'Gregory',
        handle: 'gregory', // Property order is unimportant.
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          "Gregory",
          "gregory",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (null, ?, null, ?) on conflict ("user"."handle") do update set "name" = excluded."name" returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('do nothing on conflict', () => {
    const query = db.query.user.upsert({
      data: {
        id: 100,
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, null, null, null) on conflict do nothing returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('upsert many rows', async () => {
    const query = db.query.user.upsert({
      data: [
        { id: 100, name: 'Gregory' },
        { id: 101, name: 'John' },
      ],
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
          101,
          "John",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null), (?, ?, null, null) on conflict ("user"."id") do update set "name" = excluded."name" returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('override data for update', () => {
    // Single upsert
    const query = db.query.user.upsert({
      data: {
        id: 100,
        name: 'Gregory',
      },
      update: {
        name: 'John',
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
          "John",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null) on conflict ("user"."id") do update set "name" = ? returning "id", "name", "age", "handle"",
      }
    `)

    // Many upserts
    const query2 = db.query.user.upsert({
      data: [
        { id: 100, name: 'Gregory' },
        { id: 101, name: 'John' },
      ],
      update: user => ({
        name: upper(user.name),
      }),
    })

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
          101,
          "John",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null), (?, ?, null, null) on conflict ("user"."id") do update set "name" = upper("user"."name") returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('where clause', () => {
    // ON CONFLICT (…) WHERE … DO UPDATE SET …
    const query = db.query.user.upsert({
      data: {
        id: 100,
        name: 'Gregory',
      },
      where: {
        name: { isNull: true },
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null) on conflict ("user"."id") do update set "name" = excluded."name" where "user"."name" is null returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('ignore non-column properties', () => {
    const data = {
      id: 100,
      name: 'Gregory',
      unknown: true,
    }

    const query = db.query.user.upsert({
      data,
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
        ],
        "sql": "insert into "user" ("id", "name", "age", "handle") values (?, ?, null, null) on conflict ("user"."id") do update set "name" = excluded."name" returning "id", "name", "age", "handle"",
      }
    `)
  })
})
