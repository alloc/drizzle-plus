# Rewrite Plan: Isolate Codegen Behind a Type/Code Layer

## Goal

Rewrite the generated part of `drizzle-plus` around a dedicated type/code layer
that smooths over the Drizzle dialect differences this package actually uses.
The current PostgreSQL-template-plus-string-replacement approach should be
removed, not migrated around.

The new design should make these boundaries explicit:

- Feature behavior: `upsert`, `updateMany`, `$values`, CTE helpers, relation
  helpers, and query-builder extensions.
- Dialect facts: import paths, type parameter lists, capability flags, class
  names, and supported public subpaths.
- Runtime dialect behavior: update/delete limit handling, returning support,
  CTE rendering behavior, insert builders, update builders, and private Drizzle
  access.
- Generated output: dialect entrypoints, module augmentations, and indexes.

The rewrite should keep the public package API stable unless we intentionally
decide otherwise, but the internal generated implementation can be replaced in
one direct pass.

## Current Problems

`scripts/generate.ts` currently generates `src/generated/{pg,mysql,sqlite}` by
rewriting PostgreSQL-oriented source files from `src/generated/*.ts`.

That creates a few structural problems:

- Feature files are half implementation and half template.
- Dialect differences are encoded as text replacement rules, comment markers,
  and PostgreSQL names that are later rewritten.
- `src/generated/internal.ts` mixes reusable helpers with PostgreSQL-specific
  types and private Drizzle hooks.
- Runtime differences are split between feature files and
  `src/generated/adapters/{pg,mysql,sqlite}.ts`.
- Unsupported features are defined in the generator, disconnected from type
  definitions, package exports, and tests.
- The generated directories look like source, even though they are derived
  output.

## Rewrite Shape

Build the new generated system from four source-of-truth areas.

### 1. Dialect Registry

Create `src/codegen/dialects/registry.ts` as the canonical model of each
dialect.

It should describe:

- dialect name: `pg`, `mysql`, `sqlite`
- Drizzle module specifiers for database, core, table, column, query-builder,
  and relational-query types
- type names used in generated augmentations
- type parameter lists for database and relational query builder interfaces
- capability flags, such as returning support, materialized CTE support,
  native update/delete limits, `create`, and `upsert`
- public export suffixes that should exist for the dialect

This replaces `pascalMap`, `unsupportedFeatures`, `typeParams`, `DIALECT`, and
the comment-marker replacement scheme.

### 2. Runtime Adapter Layer

Create dialect runtime adapters under `src/codegen/dialects`:

```text
src/codegen/dialects/
  pg.ts
  mysql.ts
  sqlite.ts
```

Expose a common adapter contract from `src/codegen/core/adapter.ts`.

The adapter should cover only real runtime differences used by this package:

- selecting rows for PostgreSQL limited update/delete via CTE/`ctid`
- applying native `limit` and `orderBy` for MySQL and SQLite
- applying returning clauses where supported
- constructing insert/update/delete builders when the class names differ
- creating dialect-specific relational query and database prototype bindings
- centralizing any unavoidable private Drizzle access

Feature code should ask the adapter to do dialect-specific work. It should not
branch on string dialect names unless the branch represents package-level
feature availability.

### 3. Core Type/Runtime Facade

Create `src/codegen/core` for shared behavior that feature implementations can
use directly.

Initial modules:

```text
src/codegen/core/
  adapter.ts
  context.ts
  returning.ts
  filters.ts
  orderBy.ts
  conflict.ts
  insertSelect.ts
  cte.ts
  subquery.ts
  selection.ts
  promises.ts
  types.ts
```

Responsibilities:

- extract a relational query context from Drizzle query builders
- expose table, columns, schema, relation config, dialect, and session through
  a package-owned `QueryContext`
- convert relation filters and relation order clauses into SQL
- normalize returning-clause behavior
- infer conflict targets from primary keys, unique constraints, and unique
  indexes
- build insert-select field maps for the Drizzle insert-select workaround
- manage CTE metadata for recursive/materialized/not-materialized CTEs
- create selected subqueries with decoder-preserving fields
- provide reusable query promise wrappers

This layer is where private Drizzle assumptions should live. Feature modules
should import private Drizzle classes directly only when there is no reasonable
facade boundary.

### 4. Feature Implementations

Move feature source out of `src/generated` and into `src/codegen/features`.

Proposed layout:

```text
src/codegen/features/
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
```

Each feature should export:

- the shared runtime installer or implementation
- any package-owned result/config types
- metadata describing supported dialects and generated module augmentations

Feature source should not be a dialect template. If a feature needs
dialect-specific behavior, that behavior belongs in the dialect adapter or in
an explicit per-dialect implementation file.

## Generated Output

Keep `src/generated/{pg,mysql,sqlite}` as generated output for now so existing
exports and build discovery stay recognizable. Treat it as disposable output.

Generated files should be small:

- import the appropriate dialect adapter
- import the shared feature implementation
- declare the exact Drizzle module augmentation for that dialect
- install the feature on the correct prototype
- export any public feature types that belong on the dialect subpath

The generator should not rewrite arbitrary TypeScript source. It should emit
files from structured metadata and small templates owned by the generator.

## Generator Rewrite

Replace `scripts/generate.ts` with a structured emitter.

Inputs:

- dialect registry
- feature manifests
- package export expectations
- dialect function directories under `src/functions/{pg,mysql,sqlite}`

Outputs:

- `src/generated/<dialect>/tsconfig.json`
- `src/generated/<dialect>/index.ts`
- one generated entrypoint per supported feature
- generated dialect `types.ts` where needed
- copied or re-exported dialect SQL function files

Generator rules:

- never perform global `Pg` to `MySql`/`SQLite` replacement
- never use commented insertion markers
- never use `eval` for conditional replacement
- skip unsupported features from registry capabilities
- fail if package exports reference unsupported or missing generated files
- fail if a feature has no test coverage marker in its manifest

## Public API Compatibility

The rewrite should preserve these unless a separate breaking-change decision is
made:

- `drizzle-plus/pg/*`, `drizzle-plus/mysql/*`, and `drizzle-plus/sqlite/*`
  public subpaths
- dialect index exports
- side-effect imports that install prototype methods
- query promise result types
- returning-clause semantics
- generated helper names, including `$values`, `$select`, `$withRecursive`,
  `$withMaterialized`, `$without`, and `withoutFrom`

The rewrite may change internal paths under `src/codegen` and `src/generated`.
Do not expose new internal paths in `package.json` until the design settles.

## Rewrite Work Plan

1. Build the new source tree.

   Add `src/codegen/core`, `src/codegen/dialects`, and
   `src/codegen/features`. Copy behavior from the old generated templates only
   as implementation reference, not as retained architecture.

2. Define the dialect registry and feature manifest.

   Model all supported features, public subpaths, module augmentation targets,
   and dialect capabilities before writing the new generator.

3. Implement core facade modules.

   Move the logic currently buried in `src/generated/internal.ts` and shared
   generated feature files into stable core helpers.

4. Implement dialect adapters.

   Recreate the behavior from the current `src/generated/adapters/*` modules
   behind one adapter contract, including PostgreSQL limited updates and
   MySQL/SQLite native limits.

5. Implement feature modules against the facade.

   Port each feature into normal TypeScript modules. Start with the features
   that establish the hard contracts: `updateMany`, `upsert`, `$values`, and
   `$withRecursive`.

6. Replace the generator.

   Write generated dialect entrypoints from registry and feature metadata.
   Delete the broad text-rewrite implementation.

7. Regenerate all dialect output.

   Recreate `src/generated/{pg,mysql,sqlite}` from the new generator. Generated
   output can change substantially as long as public imports and behavior hold.

8. Update package/build wiring.

   Ensure `rolldown.config.ts`, `package.json` exports, and TypeScript paths
   point at the new generated output. Add generator checks that prevent missing
   export targets.

9. Remove old template source.

   Delete obsolete top-level `src/generated/*.ts` templates, `DIALECT` support,
   comment marker conventions, and replacement-only helper code.

10. Verify behavior and types across dialects.

    Run runtime tests, type tests, lint, and build. Add missing tests for any
    feature whose behavior was previously covered only incidentally.

## Feature Priorities

Implement the high-risk features first because they define the facade shape:

- `updateMany`: exercises relation filters, order clauses, limited updates,
  returning support, and adapter behavior.
- `upsert`: exercises insert builders, insert-select, conflict target
  inference, excluded values, returning behavior, query promises, and subquery
  conversion.
- `$values`: exercises generated table-like values, column typing, casts,
  decoder mapping, and SQL rendering.
- `$withRecursive`, `$withMaterialized`, `$withNotMaterialized`: exercise CTE
  metadata and private Drizzle dialect hooks.

Then implement lower-risk helpers:

- `$cursor`
- `$findMany`
- `count`
- `create`
- `findUnique`
- `findManyAndCount`
- `$select`
- `as`
- `fromSingle`
- `$without`
- `withoutFrom`

## Testing Strategy

Use the existing tests as compatibility tests, but do not rely on them as the
only rewrite safety net.

Required checks:

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- generated export resolution check for every `package.json` export
- type tests for dialect-specific method availability
- SQL snapshot or assertion coverage for generated SQL where behavior differs
  by dialect

Feature-specific coverage:

- `updateMany`: PostgreSQL CTE-limited update SQL, MySQL/SQLite native
  limit/order SQL, returning support, and unsupported MySQL returning types.
- `upsert`: one vs many result behavior, explicit target, inferred target,
  custom update, no-op update fallback for returning rows, `updateWhere`, and
  insert-select data.
- `$values`: typed columns, casts, inline params, aliases, selected subquery
  fields, and decoder behavior.
- CTE helpers: recursive self-reference typing, materialized and
  not-materialized rendering, and compatibility with multiple CTEs.
- Package exports: every public subpath resolves after build.

## Rewrite Guardrails

- Keep the public API stable unless a breaking change is explicitly approved.
- Do not add new dependencies unless the generator materially needs one.
- Keep dialect differences in registry/adapters, not scattered through feature
  code.
- Prefer explicit generated templates over source-code rewriting.
- Centralize private Drizzle access and document the exact assumption each hook
  depends on.
- Make unsupported dialect features impossible to generate, export, or type as
  available.
- Treat `src/generated` as output. Do not hand-edit generated files after the
  rewrite lands.

## Open Decisions

- Should `src/generated` remain checked in, or should it become build-only
  output?
- Should the package keep one public subpath per feature, or add grouped
  side-effect imports such as `drizzle-plus/pg/extensions`?
- Should dialect function files continue to be copied into generated folders,
  or should dialect indexes re-export them from `src/functions/<dialect>`?
- Should generator validation update `package.json` exports automatically or
  fail until exports are updated manually?
- How much of the private Drizzle API surface should be version-guarded at
  runtime?

## Definition Of Done

The rewrite is done when:

- `scripts/generate.ts` emits from registry/feature metadata, not arbitrary
  source rewrites
- top-level generated templates and marker comments are gone
- feature implementations live under `src/codegen/features`
- dialect facts live in one registry
- runtime dialect differences live behind adapter contracts
- private Drizzle hooks are centralized in `src/codegen/core` or adapters
- all existing intended public imports still resolve
- runtime tests, type tests, lint, and build pass
- generated output can be deleted and recreated without hand edits
