import type { SQL } from 'drizzle-orm'
import 'drizzle-plus/mysql/$select'
import 'drizzle-plus/mysql/$values'
import 'drizzle-plus/mysql/$without'
import 'drizzle-plus/mysql/count'
import 'drizzle-plus/mysql/findManyAndCount'
import 'drizzle-plus/mysql/findUnique'
import 'drizzle-plus/mysql/fromSingle'
import 'drizzle-plus/mysql/orThrow'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/mysql/withoutFrom'
import 'drizzle-plus/pg/$select'
import 'drizzle-plus/pg/$values'
import 'drizzle-plus/pg/$without'
import 'drizzle-plus/pg/count'
import 'drizzle-plus/pg/create'
import 'drizzle-plus/pg/findManyAndCount'
import 'drizzle-plus/pg/findUnique'
import 'drizzle-plus/pg/fromSingle'
import 'drizzle-plus/pg/orThrow'
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/pg/withoutFrom'
import 'drizzle-plus/sqlite/$select'
import 'drizzle-plus/sqlite/$values'
import 'drizzle-plus/sqlite/$without'
import 'drizzle-plus/sqlite/count'
import 'drizzle-plus/sqlite/findManyAndCount'
import 'drizzle-plus/sqlite/findUnique'
import 'drizzle-plus/sqlite/fromSingle'
import 'drizzle-plus/sqlite/orThrow'
import 'drizzle-plus/sqlite/updateMany'
import 'drizzle-plus/sqlite/upsert'
import 'drizzle-plus/sqlite/withoutFrom'
import 'drizzle-plus/pg/$withMaterialized'
import {
  mysqlDb,
  mysqlUser,
  pgDb,
  pgUser,
  sqliteDb,
  sqliteUser,
} from './config/dialects'

const pgRequired = pgDb.query.user
  .findFirst({ columns: { id: true } })
  .orThrow()
const mysqlRequired = mysqlDb.query.user
  .findFirst({ columns: { id: true } })
  .orThrow()
const sqliteRequired = sqliteDb.query.user
  .findFirst({ columns: { id: true } })
  .orThrow()

expectTypeOf<Awaited<typeof pgRequired>>().toEqualTypeOf<{ id: number }>()
expectTypeOf<Awaited<typeof mysqlRequired>>().toEqualTypeOf<{ id: number }>()
expectTypeOf<Awaited<typeof sqliteRequired>>().toEqualTypeOf<{ id: number }>()

const pgRows = pgDb.select({ id: pgUser.id }).from(pgUser).orThrow()
const mysqlRows = mysqlDb.select({ id: mysqlUser.id }).from(mysqlUser).orThrow()
const sqliteRows = sqliteDb
  .select({ id: sqliteUser.id })
  .from(sqliteUser)
  .orThrow()

expectTypeOf<Awaited<typeof pgRows>>().toEqualTypeOf<{ id: number }[]>()
expectTypeOf<Awaited<typeof mysqlRows>>().toEqualTypeOf<{ id: number }[]>()
expectTypeOf<Awaited<typeof sqliteRows>>().toEqualTypeOf<{ id: number }[]>()

const createdCount = pgDb.query.user.create({ data: { id: 1 } })
const createdMany = pgDb.query.user.create({
  data: [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ],
  returning: { id: true },
})
expectTypeOf<Awaited<typeof createdCount>>().toEqualTypeOf<number>()
expectTypeOf<Awaited<typeof createdMany>>().toEqualTypeOf<{ id: number }[]>()

const pgUpdated = pgDb.query.user.updateMany({
  set: { name: 'Ada' },
  returning: user => ({ id: user.id, name: user.name }),
})
expectTypeOf<Awaited<typeof pgUpdated>>().toEqualTypeOf<
  { id: number; name: string | null }[]
>()

const sqliteUpsert = sqliteDb.query.user.upsert({
  data: { id: 1, name: 'Ada' },
  update: ({ current, excluded }) => ({
    name: excluded.name ?? current.name,
  }),
  target: ['id'],
  returning: {},
})
expectTypeOf<Awaited<typeof sqliteUpsert>>().toEqualTypeOf<undefined>()

const values = pgDb.$values([{ id: 1, label: 'Ada' }])
const valuesCte = pgDb.$withValues('values_cte', [{ id: 1, label: 'Ada' }])
expectTypeOf(values.getSQL()).toMatchTypeOf<SQL<unknown>>()
expectTypeOf(valuesCte).toHaveProperty('id')
expectTypeOf(valuesCte).toHaveProperty('label')

const selectedWithoutName = pgUser.$without('name')
expectTypeOf(selectedWithoutName).toHaveProperty('id')
expectTypeOf(selectedWithoutName).not.toHaveProperty('name')
// @ts-expect-error Table columns must be selected by their actual names.
pgUser.$without('missing')
// @ts-expect-error findUnique requires a where clause.
pgDb.query.user.findUnique({ columns: { id: true } })

// @ts-expect-error MySQL does not generate create().
mysqlDb.query.user.create({ data: { id: 1 } })
// @ts-expect-error MySQL does not generate upsert().
mysqlDb.query.user.upsert({ data: { id: 1 } })
// @ts-expect-error SQLite does not generate create().
sqliteDb.query.user.create({ data: { id: 1 } })
// @ts-expect-error Materialized CTE helpers are PostgreSQL-only.
mysqlDb.$withMaterialized('mysql_cte')
// @ts-expect-error Materialized CTE helpers are PostgreSQL-only.
sqliteDb.$withMaterialized('sqlite_cte')
// @ts-expect-error MySQL updateMany cannot accept returning.
mysqlDb.query.user.updateMany({ set: { name: 'Ada' }, returning: { id: true } })
