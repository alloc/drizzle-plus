# Refactor Plan: Isolate Codegen Behind a Type/Code Layer

## Goal

`drizzle-plus` currently treats PostgreSQL-flavored source files in
`src/generated/*.ts` as templates, then rewrites them into
`src/generated/{pg,mysql,sqlite}` with string replacement. That works, but the
core feature code now carries three kinds of concerns at once:

- public feature behavior, such as `upsert`, `updateMany`, `$values`, and CTE
  helpers
- Drizzle type differences between `pg-core`, `mysql-core`, and `sqlite-core`
- generator implementation details, such as `DIALECT`, commented insertion
  markers, and PostgreSQL names that are later rewritten

The target shape is a small type/code layer that smooths over the Drizzle
dialect differences needed by this package. Feature modules should be written
against that layer, while codegen should only assemble dialect entrypoints and
thin module augmentations.

## Current Shape

Important files:

- `scripts/generate.ts` clears `src/generated/{pg,mysql,sqlite}`, rewrites
  top-level `src/generated/*.ts` templates, and copies dialect-specific SQL
  functions into generated dialect folders.
- `src/generated/*.ts` are source templates, but they are also readable as
  PostgreSQL implementations. They import `pg-core` types directly and rely on
  generator rewrites for MySQL and SQLite.
- `src/generated/adapters/{pg,mysql,sqlite}.ts` already contains some dialect
  runtime behavior, mostly around update/delete limit handling and returning
  support.
- `src/generated/internal.ts` mixes shared utilities with PostgreSQL-specific
  types and private Drizzle hooks.
- `rolldown.config.ts` discovers generated dialect files and publishes only
  dialect indexes, generated types, and files with module augmentation.
- `package.json` exports every dialect subpath from `dist/generated/<dialect>`.

Feature groups:

- Query-builder instance methods: `$cursor`, `$findMany`, `count`, `create`,
  `findManyAndCount`, `findUnique`, `updateMany`, `upsert`, `as`.
- Database helpers: `$select`, `$values`, `$withMaterialized`,
  `$withNotMaterialized`, `$withRecursive`.
- Select/table helpers: `$without`, `withoutFrom`, `fromSingle`.
- Shared generated internals: context extraction, returning-field handling,
  conflict target inference, CTE metadata, select-to-insert workaround, subquery
  construction.
- Dialect-specific function exports: `src/functions/{pg,mysql,sqlite}` copied
  into generated dialect folders.

## Proposed Architecture

Introduce three layers:

1. `src/codegen/dialects/*`

   Owns dialect facts and all imports that are truly dialect-specific. This is
   the only layer that should know whether a database type is `PgDatabase`,
   `MySqlDatabase`, or `BaseSQLiteDatabase`, or whether a relational query has
   a prepared-query type parameter.

2. `src/codegen/core/*`

   Owns shared runtime behavior and package-level abstractions. Feature code
   should import from this layer instead of importing Drizzle dialect classes
   directly where possible.

3. `src/codegen/features/*`

   Owns feature implementations expressed in terms of the core abstractions.
   A feature may still provide per-dialect hooks for real behavioral
   differences, but normal type-name differences should not leak into feature
   logic.

The generated output should become an assembly artifact:

- dialect index files
- dialect module augmentation files
- small dialect entrypoint files that bind a feature to one dialect adapter

The current `src/generated/*.ts` files can migrate incrementally into
`src/codegen/features/*`. The current generated public subpaths can remain
unchanged during the migration.

## New Type/Code Facade

Start with a deliberately small facade based on existing use cases.

### Dialect Registry

Create a registry module, for example `src/codegen/dialects/registry.ts`, with
data like:

```ts
export type DialectName = 'pg' | 'mysql' | 'sqlite'

export interface DialectSpec {
  name: DialectName
  module: {
    core: string
    db: string
    query: string
  }
  typeNames: {
    database: string
    table: string
    column: string
    insertValue: string
    updateSetSource: string
    relationalQueryBuilder: string
    relationalQuery: string
  }
  capabilities: {
    returning: boolean
    materializedCte: boolean
    create: boolean
    upsert: boolean
    nativeUpdateDeleteLimit: boolean
    updateDeleteReturning: boolean
  }
  typeParams: {
    database: string[]
    relationalQueryBuilder: string[]
    relationalQuery: string[]
    sessionSuffix?: string
  }
}
```

This replaces `pascalMap`, `unsupportedFeatures`, and most ad hoc replacement
rules in `scripts/generate.ts`.

### Runtime Adapter Contract

Move the current adapter functions into a stable interface, for example
`src/codegen/core/adapter.ts`:

```ts
export interface DialectRuntimeAdapter {
  selectRowsToUpdateOrDelete?(args: UpdateDeleteLimitArgs): Subquery[]
  innerJoinMatchedRows?(args: MatchedRowsJoinArgs): void
  limitUpdateOrDelete?(args: NativeLimitArgs): void
  setReturningClauseForUpdateOrDelete?(args: ReturningArgs): void
  createInsertBuilder(args: InsertBuilderArgs): unknown
  createUpdateBuilder(args: UpdateBuilderArgs): unknown
}
```

The first pass can wrap existing adapter modules without changing behavior:

- PostgreSQL keeps the CTE/`ctid` strategy for limited updates.
- MySQL and SQLite keep native `limit`/`orderBy` behavior.
- PostgreSQL and SQLite keep returning support.
- MySQL reports no returning support.

### Shared Context

Move `getContext` behind a dialect-neutral shape:

```ts
export interface QueryContext {
  table: Table
  columns: Record<string, Column>
  schema: TablesRelationalConfig
  tableConfig: TableRelationalConfig
  dialect: unknown
  session: unknown
}
```

Use narrow helper functions for operations that need private Drizzle details:

- `getQueryContext(rqb)`
- `getFilterSQL(ctx, filter)`
- `getOrderBySQL(ctx, orderBy)`
- `getReturningFields(returning, columns)`
- `getConflictTarget(table, columns)`
- `buildInsertSelectFields(...)`
- `createSelectedSubquery(...)`

This makes private Drizzle access explicit and testable in one place.

### Feature Definitions

Represent each generated feature as a definition rather than a raw template:

```ts
export interface FeatureDefinition {
  name: string
  dialects: DialectName[]
  runtimeModule: string
  augmentations: ModuleAugmentation[]
  exports?: string[]
}
```

The generator should use feature metadata to emit dialect entrypoints and
module augmentation wrappers. Feature implementation files should stay normal
TypeScript modules whenever possible.

## Proposed Directory Layout

```text
src/
  codegen/
    core/
      adapter.ts
      context.ts
      cte.ts
      returning.ts
      conflict.ts
      insertSelect.ts
      subquery.ts
      types.ts
    dialects/
      registry.ts
      pg.ts
      mysql.ts
      sqlite.ts
    features/
      query/
        cursor.ts
        findMany.ts
        count.ts
        create.ts
        updateMany.ts
        upsert.ts
        findUnique.ts
        findManyAndCount.ts
      db/
        select.ts
        values.ts
        withMaterialized.ts
        withRecursive.ts
      select/
        as.ts
        fromSingle.ts
        without.ts
        withoutFrom.ts
    generated/
      manifest.ts
scripts/
  generate.ts
src/generated/
  pg/
  mysql/
  sqlite/
```

`src/generated` can remain the build output location for now, because existing
exports and build discovery already expect it. The meaningful change is that
source-of-truth feature code moves out of `src/generated`.

## Codegen Strategy

Replace broad string replacement with small, explicit emitters.

### Phase 1: Manifest-Driven Existing Templates

Keep the current templates, but move the dialect configuration into
`src/codegen/dialects/registry.ts` and have `scripts/generate.ts` read a feature
manifest. This reduces hidden behavior before moving implementation code.

The generator should:

- clear dialect output directories
- emit `tsconfig.json`
- for each feature, skip unsupported dialects from capability metadata
- apply only targeted transforms that are still needed
- copy dialect function files as it does today

### Phase 2: Thin Generated Entrypoints

Move one feature at a time into `src/codegen/features`. Generated files should
become small wrappers that:

- import a dialect runtime adapter
- import a shared feature installer
- declare the dialect-specific module augmentation
- call the installer for that dialect's prototype

For example, `src/generated/pg/updateMany.ts` should eventually contain only
the PostgreSQL augmentation and an installer call. The shared update behavior
lives in `src/codegen/features/query/updateMany.ts`.

### Phase 3: Typed Augmentation Emitters

Once enough features share the same patterns, generate module augmentation
signatures from structured metadata instead of maintaining dialect-specific
copies by textual substitution.

This is useful for:

- `RelationalQueryBuilder` methods with dialect-specific type parameters
- `PgDatabase`/`MySqlDatabase`/`BaseSQLiteDatabase` methods
- unsupported methods that should not produce exported subpaths

## Migration Order

1. Add the dialect registry and feature manifest.

   No public behavior changes. `scripts/generate.ts` still writes the same
   files, but configuration stops living as local constants and string
   conditionals.

2. Extract shared internals.

   Move neutral helpers from `src/generated/internal.ts` into
   `src/codegen/core`, leaving generated dialect `internal.ts` files as
   compatibility re-exports or thin dialect binders.

3. Wrap existing adapters in the runtime adapter contract.

   Keep `src/generated/adapters/*` or move them to `src/codegen/dialects/*`,
   but expose one stable shape to feature code.

4. Migrate `updateMany` first.

   It is the best pilot because it already uses adapter functions and exercises
   real dialect differences: PostgreSQL limited updates through CTEs, native
   limits for MySQL/SQLite, and returning support differences.

5. Migrate `create`.

   PostgreSQL-only today, so it validates that unsupported dialect filtering is
   handled by metadata instead of template comments.

6. Migrate `upsert`.

   This is the highest-risk query feature. Do it after the facade has proven
   itself with `updateMany` and `create`.

7. Migrate CTE and values helpers.

   `$withMaterialized`, `$withRecursive`, and `$values` depend on private
   Drizzle behavior and selection typing. Moving them after query-builder
   methods keeps the risk contained.

8. Migrate remaining simple extensions.

   `$cursor`, `$findMany`, `count`, `findUnique`, `findManyAndCount`, `$select`,
   `as`, `fromSingle`, `$without`, and `withoutFrom` can follow once the
   augmentation emitter pattern is stable.

9. Remove broad template rewriting.

   Delete the `DIALECT` placeholder, dialect comment markers, and global
   PostgreSQL-name rewrites after all feature modules are emitted from metadata
   or written against the facade.

## Public API Compatibility

Keep these stable during the refactor:

- Package exports in `package.json`.
- Dialect import paths such as `drizzle-plus/pg/upsert` and
  `drizzle-plus/sqlite/$values`.
- Dialect index exports from `drizzle-plus/{pg,mysql,sqlite}`.
- Runtime side effects from importing a generated feature module.
- Existing result types for query promises and returning clauses.

If a new internal source path is exported for tests, keep it private to the
workspace and avoid adding public package export entries until the shape is
settled.

## Testing Strategy

Use the existing tests as regression coverage, then add focused type tests where
the facade replaces generator rewrites.

Minimum checks per migration step:

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- generated file diff review after `pnpm build`

Feature-specific checks:

- `updateMany`: SQL output and return type behavior for PostgreSQL, MySQL, and
  SQLite where supported.
- `create`: PostgreSQL insert behavior, `skipDuplicates`, returning defaults,
  and empty returning object behavior.
- `upsert`: single-row result unwrapping, insert-select handling, inferred
  conflict target, explicit target, custom `update`, `updateWhere`, and
  returning-as-subquery.
- CTE helpers: recursive/materialized metadata survives through SQL rendering.
- Generated exports: every package export still resolves after build.

## Risks And Mitigations

- Drizzle private APIs may change.
  Keep private hooks centralized in `src/codegen/core` and dialect adapters so
  upgrades touch fewer feature files.

- Type abstractions may become too generic.
  Only smooth differences already used by this package. Do not try to model all
  of Drizzle.

- Generated output may drift unintentionally.
  During each step, compare generated output before and after. Prefer identical
  output when the step is only moving configuration.

- Module augmentation is sensitive to exact module specifiers.
  Keep augmentation emission explicit and covered by type tests.

- Public subpaths depend on `src/generated`.
  Keep generated output paths stable until the refactor is complete.

## Definition Of Done

The refactor is complete when:

- feature implementations no longer depend on broad string replacement
- dialect differences are represented by a registry, capability flags, runtime
  adapters, and narrow type emitters
- `src/generated` is output-only or near-output-only
- existing public imports continue to work
- build, lint, runtime tests, and type tests pass across supported dialects
- private Drizzle access is centralized and documented in the core facade
