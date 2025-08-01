# Drizzle Plus Specification

Extends Drizzle ORM v1.0.0+ with query methods, SQL functions, utilities via prototype extensions.

## Import Pattern

```typescript
import 'drizzle-plus/pg/upsert' // Enables db.query.table.upsert()
import { jsonBuildObject } from 'drizzle-plus/pg'
import { caseWhen, nest } from 'drizzle-plus'
```

## Query Extensions

### RelationalQueryBuilder

- `upsert(config)`: INSERT ON CONFLICT. Config: {data, update?, where?, returning?, with?}. Returns UpsertQueryPromise.
- `updateMany(config)`: Bulk update. Config: {set, where?, orderBy?, limit?, returning?}. Returns UpdateManyQueryPromise.
- `count(filter?)`: Count rows. Returns CountQueryPromise<number>.
- `findUnique(config)`: By PK/unique. Config requires where matching constraints. Returns PgRelationalQuery<result | undefined>.
- `findManyAndCount(config?)`: Parallel findMany + count. Returns {data: T[], count: number}.
- `$cursor(orderBy, cursor)`: Cursor pagination. Returns {where, orderBy}.

### PgDatabase

- `$withMaterialized(alias, selection?)`: Materialized CTE.
- `$withNotMaterialized(alias, selection?)`: Non-materialized CTE.

### PgSelectBuilder

- `fromSingle()`: Single-row placeholder for left joins.

### QueryPromise

- `orThrow(message?)`: Throw on null/empty result.

## SQL Functions (PostgreSQL)

- `jsonAgg<T>(value)`: `SQL<T[]>` - json_agg with decoding.
- `jsonBuildObject<T>(subquery)`: `ToJsonObject<T>` - json_build_object from subquery/object.
- Universal: `abs`, `ceil`, `coalesce`, `concatWithSeparator`, `currentDate`, `currentTime`, `currentTimestamp`, `floor`, `length`, `lower`, `mod`, `nullif`, `power`, `round`, `sqrt`, `substring`, `trim`, `upper`.

## Syntax Helpers

- `caseWhen(whenExpr, thenExpr)`: CASE WHEN. Chain `.when()` `.else()` or `.elseNull()`.
- `nest(subquery)`: Parenthesize single-column subquery, unwrap result. Throws on multi-column.

## Types

- `SQLValue<T>`: Represents a value in SQL context of type T.
- `SQLExpression<T>`: SQL expression yielding type T.
- `AnyQuery`: Generic type for any query object.
- `QueryToResult<T>`: Infers result type from query T.
- `QueryToSQL<T>`: Converts query T to SQL string.
- `InferWhereFilter<T>`: Infers where filter type for table T.
- `InferFindManyArgs<T>`: Infers arguments for findMany on table T.
- `InferFindFirstArgs<T>`: Infers arguments for findFirst on table T.
- `InferOrderBy<T>`: Infers orderBy clause for table T.
- `InferRelations<T>`: Infers relations for table T.
- `ReturningClause<TTable>`: Defines fields for RETURNING clause in table TTable.
- `ReturningResultFields<TMode, TTable, TReturning>`: Infers result fields from RETURNING.
- `ExtractTable<T>`: Extracts table type from query or expression T.
- `OrderByClause<TTable>`: Type for orderBy clauses on table TTable.
- `JSONObjectCodable`: Interface for types codable to JSON objects.
- `ToJsonObject<T>`: Converts T to JSON object type.
- `SQLTimestamp<T>`: Extends SQL for timestamps; methods: toDate() - converts to JavaScript Date.
- `UpsertQueryPromise`: Promise for upsert results, extends QueryPromise.
- `UpdateManyQueryPromise`: Promise for updateMany results, extends QueryPromise.
- `CountQueryPromise<T>`: Promise resolving to count value of type T (usually number).

## Utilities

- `mergeFindManyArgs(args1, args2)`: Combine findMany configs.
- `mergeRelationsFilter(filter1, filter2)`: Combine where filters.

## Patches

Modifies drizzle-orm for subquery columnList support in CTEs.
