import { getTableColumns, noopDecoder, sql, SQL } from 'drizzle-orm'
import { getDecoder, getSelectedFields, getSQL } from 'drizzle-plus/utils'
import { db } from './config/client'
import * as schema from './config/schema'

describe('getSelectedFields', () => {
  test('with a db.select() query', () => {
    const query1 = db.select().from(schema.user)
    expect(getSelectedFields(query1)).toEqual(getTableColumns(schema.user))

    const query2 = db.select({ id: schema.user.id }).from(schema.user)
    expect(getSelectedFields(query2)).toEqual({ id: schema.user.id })
  })

  test('with a db.query.user.findFirst() query', () => {
    const query = db.query.user.findFirst({
      columns: { id: true },
      with: { emails: true },
    })
    // console.log(getContext(query3))
    expect(getSelectedFields(query)).toMatchInlineSnapshot(`
      {
        "emails": true,
        "id": true,
      }
    `)
  })
})

describe('getSQL', () => {
  test('with a db.select() query', () => {
    const query = db.select().from(schema.user)
    expect(getSQL(query)).toBeInstanceOf(SQL)
  })

  test('with a db.query.user.findFirst() query', () => {
    const query = db.query.user.findFirst({
      columns: { id: true },
    })
    expect(getSQL(query)).toBeInstanceOf(SQL)
  })
})

const Decoder = expect.objectContaining({
  mapFromDriverValue: expect.any(Function),
})

describe('getDecoder', () => {
  test('with a column', () => {
    const result = getDecoder(schema.user.id)
    expect(result).toEqual(Decoder)
    expect(result).not.toBe(noopDecoder)
  })
  test('with a SQL instance', () => {
    const customDecoder = {
      mapFromDriverValue: (value: number) => value * 2,
    }
    const expr = sql<number>`random()`.mapWith(customDecoder)
    expect(getDecoder(expr)).toBe(customDecoder)
  })
})
