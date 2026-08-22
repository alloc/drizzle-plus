import 'drizzle-plus/sqlite/$cursor'
import { db } from './config/client'

describe('$cursor', () => {
  test('with one column', () => {
    // Ascending.
    expect(db.query.user.$cursor({ id: 'asc' }, { id: 99 }))
      .toMatchInlineSnapshot(`
        {
          "orderBy": {
            "id": "asc",
          },
          "where": {
            "id": {
              "gt": 99,
            },
          },
        }
      `)

    // Descending.
    expect(db.query.user.$cursor({ id: 'desc' }, { id: 99 }))
      .toMatchInlineSnapshot(`
        {
          "orderBy": {
            "id": "desc",
          },
          "where": {
            "id": {
              "lt": 99,
            },
          },
        }
      `)
  })

  test('without a cursor', () => {
    expect(db.query.user.$cursor({ id: 'asc' }, undefined)).toEqual({
      where: undefined,
      orderBy: { id: 'asc' },
    })
    expect(db.query.user.$cursor({ id: 'desc' }, null)).toEqual({
      where: undefined,
      orderBy: { id: 'desc' },
    })
  })

  test('with undefined order columns and a missing cursor value', () => {
    expect(
      db.query.user.$cursor({ id: 'asc', name: undefined }, { id: 99 })
    ).toEqual({
      where: { id: { gt: 99 } },
      orderBy: { id: 'asc', name: undefined },
    })

    expect(
      db.query.user.$cursor({ name: 'asc', id: 'asc' }, { id: 99 })
    ).toEqual({
      where: {
        OR: [
          { name: { gt: null } },
          { AND: [{ name: null }, { id: { gt: 99 } }] },
        ],
      },
      orderBy: { name: 'asc', id: 'asc' },
    })
  })

  test('with multiple columns', () => {
    expect(
      db.query.user.$cursor(
        { name: 'asc', age: 'desc' },
        { name: 'John', age: 20 }
      )
    ).toMatchInlineSnapshot(`
      {
        "orderBy": {
          "age": "desc",
          "name": "asc",
        },
        "where": {
          "OR": [
            {
              "name": {
                "gt": "John",
              },
            },
            {
              "AND": [
                {
                  "name": "John",
                },
                {
                  "age": {
                    "lt": 20,
                  },
                },
              ],
            },
          ],
        },
      }
    `)

    // Reverse order.
    expect(
      db.query.user.$cursor(
        { name: 'desc', age: 'asc' },
        { name: 'John', age: 20 }
      )
    ).toMatchInlineSnapshot(`
      {
        "orderBy": {
          "age": "asc",
          "name": "desc",
        },
        "where": {
          "OR": [
            {
              "name": {
                "lt": "John",
              },
            },
            {
              "AND": [
                {
                  "name": "John",
                },
                {
                  "age": {
                    "gt": 20,
                  },
                },
              ],
            },
          ],
        },
      }
    `)

    // Three columns.
    const cursor = db.query.user.$cursor(
      { name: 'desc', age: 'desc', id: 'desc' },
      { name: 'John', age: 20, id: 99 }
    )

    // Verify that property order is preserved.
    expect(Object.entries(cursor.where)).toMatchInlineSnapshot(`
      [
        [
          "OR",
          [
            {
              "name": {
                "lt": "John",
              },
            },
            {
              "AND": [
                {
                  "name": "John",
                },
                {
                  "age": {
                    "lt": 20,
                  },
                },
              ],
            },
            {
              "AND": [
                {
                  "name": "John",
                },
                {
                  "age": 20,
                },
                {
                  "id": {
                    "lt": 99,
                  },
                },
              ],
            },
          ],
        ],
      ]
    `)
    expect(Object.entries(cursor.orderBy)).toMatchInlineSnapshot(`
      [
        [
          "name",
          "desc",
        ],
        [
          "age",
          "desc",
        ],
        [
          "id",
          "desc",
        ],
      ]
    `)
  })
})
