# Upsert

Import the `upsert` module to extend the query builder API with a `upsert` method.

> [!WARNING]
> 🐬 **MySQL** is not supported yet.

The `upsert` method intelligently infers the correct columns to update based on the primary key and unique constraints of the table. This means you're _not_ required to manually specify a `where` clause (as you would in Prisma).

```ts
// Choose your dialect
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/sqlite/upsert'

// Now you can use the `upsert` method
const query = db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "name") values (?, ?) on conflict ("user"."id") do update set "name" = excluded."name" returning "id", "name"`,
//   params: [42, 'Chewbacca'],
// }

// Execute the query
const result = await query
// => {
//   id: 42,
//   name: 'Chewbacca',
// }
```

#### Returning clause

By default, `upsert` will return all columns of the upserted row. But you can specify a `returning` clause to return only the columns you want. Any SQL expression is allowed in the `returning` clause.

```ts
import { upper } from 'drizzle-plus'

const result = await db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
  // Pass a function to reference the upserted row, or pass a plain object.
  returning: user => ({
    id: true,
    nameUpper: upper(user.name),
    random: sql<number>`random()`,
  }),
})
// => {
//   id: 42,
//   nameUpper: 'CHEWBACCA',
//   random: 0.123456789,
// }
```

Set `returning` to an empty object to return nothing.

#### Upserting many rows

You may pass an array of objects to the `data` property to upsert many rows at once. For optimal performance and atomicity guarantees, the rows are upserted in a single query.

```ts
const rows = await db.query.user.upsert({
  data: [
    { id: 42, name: 'Chewbacca' },
    { id: 43, name: 'Han Solo' },
  ],
})
// => [{ id: 42, name: 'Chewbacca' }, { id: 43, name: 'Han Solo' }]
```

#### Conditional updates

If a row should only be updated if it matches a certain condition, you can set the `where` option. This accepts the same object as the `where` clause of `db.query#findMany()`.

```ts
const query = db.query.user.upsert({
  data: {
    id: 42,
    handle: 'chewie',
  },
  where: {
    emailVerified: true,
  },
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "handle") values (?, ?) on conflict ("user"."id") do update set "handle" = excluded."handle" where "user"."email_verified" = true returning "id", "handle"`,
//   params: [42, 'chewie'],
// }
```

#### Updating with different data

If the data you wish to _insert_ with is different from the data you wish to
_update_ with, try setting the `update` option. This option can either be a function that receives the table as an argument, or a plain object. This feature works with both single and many upserts (e.g. when `data` is an array).

```ts
const query = db.query.user.upsert({
  data: {
    id: 42,
    loginCount: 0,
  },
  update: user => ({
    // Mutate the existing count if the row already exists.
    loginCount: sql`${user.loginCount} + 1`,
  }),
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "login_count") values (?, ?) on conflict ("user"."id") do update set "login_count" = "user"."login_count" + 1 returning "id", "login_count"`,
//   params: [42, 0],
// }
```

#### Upserting relations

There are no plans to support Prisma’s `connect` or `connectOrCreate` features. It’s recommended to use `db.transaction()` instead.

> [!NOTE]
> Depending on the complexity of the relations, it may be possible to utilize
> _subqueries_ instead of using `db.transaction()`. Do that if you can, since it
> will avoid the round trip caused by each `await` in the transaction callback.

```ts
import 'drizzle-plus/pg/upsert'
import { nest } from 'drizzle-plus'

await db.transaction(async tx => {
  const { id } = await tx.query.user.upsert({
    data: {
      id: 42,
      name: 'Chewbacca',
    },
    returning: {
      id: true,
    },
  })
  await tx.query.friendship.upsert({
    data: {
      userId: id,
      friendId: nest(
        tx.query.user.findFirst({
          where: {
            name: 'Han Solo',
          },
          columns: {
            id: true,
          },
        })
      ),
    },
  })
})
```
