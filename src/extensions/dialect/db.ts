import type { AnyRelations, TablesRelationalConfig } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { Database as CoreDatabase } from './core'

export declare class Database<
  TQueryResult = unknown,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
  TRelations extends AnyRelations = AnyRelations,
  TTablesConfig extends TablesRelationalConfig = TablesRelationalConfig,
  TSchema extends V1.TablesRelationalConfig = V1.TablesRelationalConfig,
> extends CoreDatabase<
  TQueryResult,
  TFullSchema,
  TRelations,
  TTablesConfig,
  TSchema
> {}
