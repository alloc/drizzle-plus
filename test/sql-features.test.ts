import { sql } from 'drizzle-orm'
import {
  abs,
  caseWhen,
  ceil,
  coalesce,
  concatWithSeparator,
  currentDate,
  currentTime,
  currentTimestamp,
  floor,
  length,
  lower,
  mod,
  nest,
  nullif,
  power,
  round,
  sqrt,
  substring,
  toSQL,
  trim,
  upper,
} from 'drizzle-plus'
import {
  cast as mysqlCast,
  concat as mysqlConcat,
  jsonArrayAgg,
  jsonObject as mysqlJsonObject,
  position as mysqlPosition,
} from 'drizzle-plus/mysql'
import {
  cast as pgCast,
  concat as pgConcat,
  jsonAgg,
  jsonAggNotNull,
  jsonBuildObject,
  position as pgPosition,
  rowToJson,
  uuidExtractTimestamp,
  uuidv7,
} from 'drizzle-plus/pg'
import {
  cast as sqliteCast,
  concat as sqliteConcat,
  instr,
  jsonGroupArray,
  jsonObject as sqliteJsonObject,
} from 'drizzle-plus/sqlite'
import { getDecoder } from 'drizzle-plus/utils'
import {
  createJsonArrayDecoder,
  createJsonObjectDecoder,
} from 'drizzle-plus/utils'
import 'drizzle-plus/sqlite/count'
import 'drizzle-plus/sqlite/as'
import { db } from './config/client'
import {
  mysqlDb,
  mysqlUser,
  pgDb,
  pgUser,
  sqliteDb,
  sqliteUser,
} from './config/dialects'
import * as schema from './config/schema'

describe('SQL syntax helpers', () => {
  test('caseWhen skips empty branches and handles scalar subquery errors', () => {
    const query = db
      .select({
        fallback: caseWhen(undefined, 1).else(2),
        empty: caseWhen(undefined, 1).elseNull(),
      })
      .from(schema.user)

    expect(query.toSQL()).toMatchObject({
      params: [2],
      sql: expect.stringContaining('select ?, NULL'),
    })

    expect(() =>
      nest(
        db
          .select({ id: schema.user.id, name: schema.user.name })
          .from(schema.user)
      )
    ).toThrow('Subquery must have exactly one column')
    expect(() => nest(db.select({}).from(schema.user))).toThrow(
      'Subquery must have exactly one column'
    )
  })

  test('toSQL preserves wrappers and binds JavaScript values', () => {
    const valueQuery = db
      .select({ value: toSQL(42), text: toSQL('Ada') })
      .from(schema.user)
    expect(valueQuery.toSQL().params).toEqual([42, 'Ada'])

    const wrapper = sql<number>`random()`
    expect(toSQL(wrapper)).toBe(wrapper)
  })
})

describe('universal SQL functions', () => {
  test('emits every common function family', () => {
    const query = db
      .select({
        abs: abs(schema.user.age),
        ceil: ceil(schema.user.age),
        floor: floor(schema.user.age),
        length: length(schema.user.name),
        lower: lower(schema.user.name),
        trim: trim(schema.user.name),
        upper: upper(schema.user.name),
        mod: mod(schema.user.age, 2),
        power: power(schema.user.age, 2),
        round: round(schema.user.age, 1),
        sqrt: sqrt(schema.user.age),
        substring: substring(schema.user.name, 1, 2),
        coalesce: coalesce(schema.user.name, 'unknown'),
        concat: concatWithSeparator('-', schema.user.name, 'user'),
        nullif: nullif(schema.user.name, 'unknown'),
        date: currentDate(),
        time: currentTime(),
        timestamp: currentTimestamp(),
      })
      .from(schema.user)

    const result = query.toSQL()
    for (const name of [
      'abs',
      'ceil',
      'floor',
      'length',
      'lower',
      'trim',
      'upper',
      'mod',
      'power',
      'round',
      'sqrt',
      'substring',
      'coalesce',
      'concat_ws',
      'nullif',
      'current_date',
      'current_time',
      'current_timestamp',
    ]) {
      expect(result.sql).toContain(name)
    }
  })
})

describe('timestamps and JSON decoders', () => {
  test('decodes timestamp expressions as Dates while preserving null', () => {
    const timestamp = currentTimestamp().toDate()
    const decoder = getDecoder(timestamp)
    expect(decoder.mapFromDriverValue('2020-01-02T03:04:05.000Z')).toEqual(
      new Date('2020-01-02T03:04:05.000Z')
    )
    expect(decoder.mapFromDriverValue(null)).toBeNull()

    const query = db
      .select({ today: currentDate().toDate(), now: timestamp })
      .from(schema.user)
    expect(query.toSQL().sql).toContain('current_date')
    expect(query.toSQL().sql).toContain('current_timestamp')
  })

  test('maps JSON arrays and objects through item decoders', () => {
    const numberDecoder = {
      mapFromDriverValue: (value: unknown) => Number(value),
    }
    expect(createJsonArrayDecoder(numberDecoder)('["1", "2"]')).toEqual([1, 2])

    const decoders = new Map([['count', numberDecoder]])
    expect(createJsonObjectDecoder(decoders)('{"count":"3"}')).toEqual({
      count: 3,
    })
  })
})

describe('dialect SQL functions', () => {
  test('builds PostgreSQL functions and UUID helpers', () => {
    const subquery = pgDb
      .select({ id: pgUser.id, name: pgUser.name })
      .from(pgUser)
      .as('user_row')
    const query = pgDb
      .select({
        cast: pgCast(pgUser.id, 'text'),
        concat: pgConcat(pgUser.name, '!'),
        position: pgPosition('A', pgUser.name),
        aggregate: jsonAgg(pgUser.name, {
          orderBy: pgUser.id,
          where: sql`true`,
        }),
        aggregateNotNull: jsonAggNotNull(pgUser.name),
        object: jsonBuildObject({ id: pgUser.id, name: pgUser.name }),
        row: rowToJson(subquery),
        uuid: uuidv7('1 day'),
        uuidTimestamp: uuidExtractTimestamp(sql<string>`'uuid'`),
      })
      .from(pgUser)

    const result = query.toSQL()
    for (const name of [
      'cast',
      'concat',
      'position',
      'jsonb_agg',
      'jsonb_build_object',
      'row_to_json',
      'uuidv7',
      'uuid_extract_timestamp',
    ]) {
      expect(result.sql).toContain(name)
    }
    expect(result.sql).toContain('filter (where')
  })

  test('builds MySQL and SQLite function variants', () => {
    const mysqlQuery = mysqlDb
      .select({
        cast: mysqlCast(mysqlUser.id, 'char'),
        concat: mysqlConcat(mysqlUser.name, '!'),
        aggregate: jsonArrayAgg(mysqlUser.name),
        object: mysqlJsonObject({ id: mysqlUser.id }),
        position: mysqlPosition('A', mysqlUser.name),
      })
      .from(mysqlUser)
    const mysqlSql = mysqlQuery.toSQL().sql
    expect(mysqlSql).toContain('json_arrayagg')
    expect(mysqlSql).toContain('json_object')
    expect(mysqlSql).toContain('position')

    const sqliteQuery = sqliteDb
      .select({
        cast: sqliteCast(sqliteUser.id, 'text'),
        concat: sqliteConcat(sqliteUser.name, '!'),
        aggregate: jsonGroupArray(sqliteUser.name),
        object: sqliteJsonObject({ id: sqliteUser.id }),
        position: instr(sqliteUser.name, 'A'),
      })
      .from(sqliteUser)
    const sqliteSql = sqliteQuery.toSQL().sql
    expect(sqliteSql).toContain('json_group_array')
    expect(sqliteSql).toContain('json_object')
    expect(sqliteSql).toContain('instr')
  })

  test('rejects unaliased PostgreSQL row subqueries', () => {
    const unaliased = pgDb.select({ id: pgUser.id }).from(pgUser).as('')
    expect(() => rowToJson(unaliased)).toThrow('Subquery must have an alias')
  })
})
