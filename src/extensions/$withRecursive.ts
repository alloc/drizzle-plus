import { ColumnsSelection, Name, SQL, StringChunk, Subquery } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import {
  Column,
  Database,
  SelectedFields,
  WithSubqueryWithSelection,
} from '#dialect/core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations'
import type { DecodedFields } from 'drizzle-plus/types'
import {
  mapSelectedFieldsToDecoders,
  orderSelectedFields,
} from 'drizzle-plus/utils'
import { setWithSubqueryAddons } from './internal'

declare module '#dialect/core' {
  interface Database<
    TQueryResult = unknown,
    TFullSchema extends Record<string, unknown> = Record<string, unknown>,
    TRelations extends AnyRelations = AnyRelations,
    TTablesConfig extends TablesRelationalConfig = TablesRelationalConfig,
    TSchema extends V1.TablesRelationalConfig = V1.TablesRelationalConfig,
  > {
    /**
     * Use this instead of `$with()` to create a subquery that can reference
     * itself. If TypeScript is failing, it may help to declare the selection
     * type explicitly at the `.as<{…}>()` call.
     *
     * A recursive CTE allows you to perform recursion within a query using the
     * `WITH RECURSIVE` syntax. A recursive CTE is often referred to as a
     * recursive query.
     */
    $withRecursive<TAlias extends string>(
      alias: TAlias
    ): {
      as<TSelection extends ColumnsSelection>(
        qb: (
          self: WithSubqueryWithSelection<TSelection, TAlias>
        ) => TypedQueryBuilder<TSelection>
      ): WithSubqueryWithSelection<TSelection, TAlias>
    }
  }
}

Database.prototype.$withRecursive = function (
  this: Database<any, any>,
  alias: string
) {
  const db = this
  return {
    as(qb): any {
      let decoders: DecodedFields

      const subquery = qb(
        createRecursiveSelection(alias, (value, prop) => {
          const decoder = decoders[prop]
          return decoder ? decoder.mapFromDriverValue(value) : value
        })
      )

      const fields = (subquery as any).getSelectedFields() as SelectedFields
      const orderedFields = orderSelectedFields<Column>(fields)
      decoders = mapSelectedFieldsToDecoders(orderedFields)

      return setWithSubqueryAddons(db.$with(alias).as(subquery), {
        recursive: true,
      })
    },
  }
}

function createRecursiveSelection(
  alias: string,
  decoder: (value: unknown, prop: string) => unknown
): any {
  const aliasName = new Name(alias)
  return new Proxy(new Subquery(new SQL([aliasName]), {}, alias, true), {
    get(subquery, prop: string) {
      if (prop === '_') {
        return subquery[prop]
      }
      return new SQL([aliasName, new StringChunk('.'), new Name(prop)]).mapWith(
        value => decoder(value, prop)
      )
    },
  })
}
