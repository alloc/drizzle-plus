# Materialized CTEs

Import the `$withMaterialized` module to extend the query builder API with `$withMaterialized()` and `$withNotMaterialized()` methods.

These methods add `MATERIALIZED` and `NOT MATERIALIZED` keywords to the CTEs, respectively, just after the `AS` keyword. You can learn more about materialized CTEs in the [PostgreSQL docs](https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION).

> [!WARNING]
> This feature is only available in Postgres.

```ts
import 'drizzle-plus/pg/$withMaterialized'

// Same API as db.$with()
const cte1 = db.$withMaterialized(alias).as(subquery)
const cte2 = db.$withNotMaterialized(alias).as(subquery)
```
