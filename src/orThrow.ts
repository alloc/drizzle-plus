import { DrizzleError } from 'drizzle-orm'
import { MySqlAsyncRelationalQuery } from 'drizzle-orm/mysql-core/async/query'
import { MySqlAsyncSelectBase } from 'drizzle-orm/mysql-core/async/select'
import { PgAsyncRelationalQuery } from 'drizzle-orm/pg-core/async/query'
import { PgAsyncSelectBase } from 'drizzle-orm/pg-core/async/select'
import {
  SQLiteAsyncRelationalQuery,
  SQLiteSyncRelationalQuery,
} from 'drizzle-orm/sqlite-core/async/query'
import { SQLiteAsyncSelectBase } from 'drizzle-orm/sqlite-core/async/select'
import { QueryPromise } from 'drizzle-orm/query-promise'

declare module 'drizzle-orm/query-promise' {
  export interface QueryPromise<T> {
    /**
     * Overrides the query's `execute` method to throw an error if the query
     * returns no rows. You may provide a custom error message, otherwise the
     * default message is `'No rows returned'`.
     */
    orThrow(message?: string): QueryPromise<Exclude<T, null | undefined>>
  }
}

function orThrow<T>(this: QueryPromise<T>, message?: string) {
  const execute = this.execute
  this.execute = function () {
    return execute.call(this).then(result => {
      if (Array.isArray(result) ? result.length === 0 : result == null) {
        throw new DrizzleError({ message: message || 'No rows returned' })
      }
      return result
    })
  }

  return this
}

QueryPromise.prototype.orThrow = orThrow

for (const prototype of [
  PgAsyncRelationalQuery.prototype,
  PgAsyncSelectBase.prototype,
  MySqlAsyncRelationalQuery.prototype,
  MySqlAsyncSelectBase.prototype,
  SQLiteAsyncRelationalQuery.prototype,
  SQLiteSyncRelationalQuery.prototype,
  SQLiteAsyncSelectBase.prototype,
]) {
  const target = prototype as any
  target.orThrow = orThrow
}

// HACK: Ensure the .d.ts file is interpreted as a module >.<
export { QueryPromise }
