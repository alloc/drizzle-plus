# Dialect-specific SQL functions

These functions have differences between dialects, whether it's the name, the function signature, or its TypeScript definition relies on dialect-specific types.

- **Postgres:**
  - `concat`
  - `jsonAgg`
  - `jsonBuildObject`
  - `position`
  - `uuidv7`
  - `uuidExtractTimestamp`
- **MySQL:**
  - `concat`
  - `jsonArrayAgg`
  - `jsonObject`
  - `position`
- **SQLite:**
  - `concat`
  - `instr`
  - `jsonGroupArray`
  - `jsonObject`

```ts
// Postgres imports
import { jsonAgg } from 'drizzle-plus/pg'

// MySQL imports
import { jsonArrayAgg } from 'drizzle-plus/mysql'

// SQLite imports
import { jsonGroupArray } from 'drizzle-plus/sqlite'
```
