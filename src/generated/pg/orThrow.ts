// @ts-nocheck
import { DrizzleError } from 'drizzle-orm'
import { QueryPromise } from 'drizzle-orm/query-promise'
import { PgSelectBase as SelectBase } from 'drizzle-orm/pg-core'
import { PgRelationalQuery as RelationalQuery } from 'drizzle-orm/pg-core/query-builders/query'

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
RelationalQuery.prototype.orThrow = orThrow as any
Object.assign(SelectBase.prototype, { orThrow })

// HACK: Ensure the generated .d.ts file is interpreted as a module >.<
export { QueryPromise }
