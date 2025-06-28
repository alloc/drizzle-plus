import { sql } from 'drizzle-orm'
import 'drizzle-plus/sqlite/upsert'
import { db } from './config/client'

describe('upsert', () => {
  test('primary key + returning', async () => {
    const query = db.query.foo.upsert({
      data: {
        id: 100,
        name: 'Gregory',
      },
      returning: {
        id: true,
        name: foo => sql<string>`upper(${foo.name})`,
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
          "Gregory",
        ],
        "sql": "insert into "foo" ("id", "name", "age", "handle") values (?, ?, null, null) on conflict ("foo"."id") do update set "name" = excluded."name" returning "id", upper("name")",
      }
    `)

    expect(await query).toMatchInlineSnapshot(`
      {
        "id": 100,
        "name": "GREGORY",
      }
    `)
  })

  test('composite primary key + no returning', () => {
    const query = db.query.orderItems.upsert({
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
        "sql": "insert into "order_items" ("orderId", "productId", "quantity") values (?, ?, ?) on conflict ("order_items"."orderId", "order_items"."productId") do update set "quantity" = excluded."quantity"",
      }
    `)
  })

  test('unique constraint', () => {
    const query = db.query.userEmails.upsert({
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
        "sql": "insert into "user_emails" ("userId", "email", "label") values (?, ?, ?) on conflict ("user_emails"."userId", "user_emails"."email") do update set "label" = excluded."label" returning "userId", "email", "label"",
      }
    `)
  })

  test('update a unique column through primary key', () => {
    const query = db.query.foo.upsert({
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
        "sql": "insert into "foo" ("id", "name", "age", "handle") values (?, null, null, ?) on conflict ("foo"."id") do update set "handle" = excluded."handle" returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('update through a unique column', () => {
    const query = db.query.foo.upsert({
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
        "sql": "insert into "foo" ("id", "name", "age", "handle") values (null, ?, null, ?) on conflict ("foo"."handle") do update set "name" = excluded."name" returning "id", "name", "age", "handle"",
      }
    `)
  })

  test('do nothing on conflict', () => {
    const query = db.query.foo.upsert({
      data: {
        id: 100,
      },
    })

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "params": [
          100,
        ],
        "sql": "insert into "foo" ("id", "name", "age", "handle") values (?, null, null, null) on conflict do nothing returning "id", "name", "age", "handle"",
      }
    `)
  })
})
