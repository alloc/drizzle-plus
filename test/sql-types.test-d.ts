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
import { SQLTimestamp } from '../src/sql/timestamp'
import { pgDb, pgUser } from './config/dialects'

type SQLData<T> = T extends { _: { type: infer TResult } } ? TResult : never

const numberExpression = sql<number>`1`
const nullableNumber = sql<number | null>`null`
const nullableString = sql<string | null>`null`
const literalString = sql<'Ada'>`'Ada'`

const universal = {
  abs: abs(numberExpression),
  ceil: ceil(nullableNumber),
  floor: floor(numberExpression),
  sqrt: sqrt(nullableNumber),
  length: length(nullableString),
  trim: trim(nullableString),
  lower: lower(literalString),
  upper: upper(literalString),
  mod: mod(nullableNumber, numberExpression),
  power: power(numberExpression, nullableNumber),
  round: round(numberExpression, numberExpression),
  substring: substring(nullableString, numberExpression),
  nullif: nullif(numberExpression, 1),
  concatNullable: concatWithSeparator('-', nullableString),
  concat: concatWithSeparator('-', 'Ada'),
  coalesce: coalesce(nullableString, 'fallback'),
}

expectTypeOf<SQLData<typeof universal.abs>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof universal.ceil>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof universal.floor>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof universal.sqrt>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof universal.length>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof universal.trim>>().toEqualTypeOf<string | null>()
expectTypeOf<SQLData<typeof universal.lower>>().toEqualTypeOf<'ada'>()
expectTypeOf<SQLData<typeof universal.upper>>().toEqualTypeOf<'ADA'>()
expectTypeOf<SQLData<typeof universal.mod>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof universal.power>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof universal.round>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof universal.substring>>().toEqualTypeOf<
  string | null
>()
expectTypeOf<SQLData<typeof universal.nullif>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof universal.concatNullable>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof universal.concat>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof universal.coalesce>>().toEqualTypeOf<
  string | null
>()

const values = {
  number: toSQL(1),
  boolean: toSQL(true),
  null: toSQL(null),
  string: toSQL('Ada'),
  wrapper: toSQL(numberExpression),
}
expectTypeOf<SQLData<typeof values.number>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof values.boolean>>().toEqualTypeOf<boolean>()
expectTypeOf<SQLData<typeof values.null>>().toEqualTypeOf<null>()
expectTypeOf<SQLData<typeof values.string>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof values.wrapper>>().toEqualTypeOf<number>()

const caseResult = caseWhen(numberExpression, 'active')
  .when(nullableNumber, 1)
  .else('unknown')
const caseNullResult = caseWhen(undefined, 1).elseNull()
expectTypeOf<SQLData<typeof caseResult>>().toEqualTypeOf<string | number>()
expectTypeOf<SQLData<typeof caseNullResult>>().toEqualTypeOf<number | null>()

const date = currentDate()
const dateValue = date.toDate()
const time = currentTime()
const timestamp = currentTimestamp()
const timestampValue = timestamp.toDate()
expectTypeOf(date).toMatchTypeOf<SQLTimestamp<string>>()
expectTypeOf<SQLData<typeof date>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof dateValue>>().toEqualTypeOf<Date>()
expectTypeOf<SQLData<typeof time>>().toEqualTypeOf<string>()
expectTypeOf(timestamp).toMatchTypeOf<SQLTimestamp<string>>()
expectTypeOf<SQLData<typeof timestampValue>>().toEqualTypeOf<Date>()

const nullableUuidTimestamp = uuidExtractTimestamp(nullableString)
const nullableUuidDate = nullableUuidTimestamp.toDate()
expectTypeOf(nullableUuidTimestamp).toMatchTypeOf<SQLTimestamp<string | null>>()
expectTypeOf<SQLData<typeof nullableUuidTimestamp>>().toEqualTypeOf<
  string | null
>()
expectTypeOf<SQLData<typeof nullableUuidDate>>().toEqualTypeOf<Date | null>()
expectTypeOf<SQLData<ReturnType<typeof uuidv7>>>().toEqualTypeOf<string>()

const casts = {
  pgNumber: pgCast(1, 'integer'),
  pgString: pgCast(1, 'text'),
  mysqlNumber: mysqlCast(1, 'int'),
  sqliteNumber: sqliteCast(1, 'real'),
}
expectTypeOf<SQLData<typeof casts.pgNumber>>().toEqualTypeOf<1>()
expectTypeOf<SQLData<typeof casts.pgString>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof casts.mysqlNumber>>().toEqualTypeOf<number>()
expectTypeOf<SQLData<typeof casts.sqliteNumber>>().toEqualTypeOf<number>()
const dynamicCastType: string = 'text'
// @ts-expect-error Cast type names must be statically validated.
pgCast(1, dynamicCastType)

const pgAggregate = jsonAgg(nullableString)
const pgAggregateNotNull = jsonAggNotNull(nullableString)
const mysqlAggregate = jsonArrayAgg(nullableString)
const sqliteAggregate = jsonGroupArray(nullableString)
expectTypeOf<SQLData<typeof pgAggregate>>().toEqualTypeOf<
  (string | null)[] | null
>()
expectTypeOf<SQLData<typeof pgAggregateNotNull>>().toEqualTypeOf<
  (string | null)[]
>()
expectTypeOf<SQLData<typeof mysqlAggregate>>().toEqualTypeOf<
  (string | null)[]
>()
expectTypeOf<SQLData<typeof sqliteAggregate>>().toEqualTypeOf<
  (string | null)[]
>()

const pgObject = jsonBuildObject({
  id: numberExpression,
  label: nullableString,
})
const mysqlObject = mysqlJsonObject({ id: numberExpression })
const sqliteObject = sqliteJsonObject({ id: numberExpression })
expectTypeOf<SQLData<typeof pgObject>>().toEqualTypeOf<{
  id: number
  label: string | null
}>()
expectTypeOf<SQLData<typeof mysqlObject>>().toEqualTypeOf<{ id: number }>()
expectTypeOf<SQLData<typeof sqliteObject>>().toEqualTypeOf<{ id: number }>()

const pgRow = pgDb.select({ id: pgUser.id }).from(pgUser).as('pg_row')
const pgRowJson = rowToJson(pgRow)
const pgPositionResult = pgPosition('A', nullableString)
const mysqlPositionResult = mysqlPosition('A', nullableString)
const sqlitePositionResult = instr(nullableString, 'A')
const pgConcatResult = pgConcat(nullableString, '!')
const mysqlConcatResult = mysqlConcat(nullableString, '!')
const sqliteConcatResult = sqliteConcat(nullableString, '!')
expectTypeOf<SQLData<typeof pgRowJson>>().toEqualTypeOf<{ id: number }>()
expectTypeOf<SQLData<typeof pgPositionResult>>().toEqualTypeOf<number | null>()
expectTypeOf<SQLData<typeof mysqlPositionResult>>().toEqualTypeOf<
  number | null
>()
expectTypeOf<SQLData<typeof sqlitePositionResult>>().toEqualTypeOf<
  number | null
>()
expectTypeOf<SQLData<typeof pgConcatResult>>().toEqualTypeOf<string>()
expectTypeOf<SQLData<typeof mysqlConcatResult>>().toEqualTypeOf<string | null>()
expectTypeOf<SQLData<typeof sqliteConcatResult>>().toEqualTypeOf<string>()

expectTypeOf(pgRow).toHaveProperty('id')
