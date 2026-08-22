import { executeSelect as executeMySqlSelect } from '../src/internal/dialects/mysql'
import { executeSelect as executePgSelect } from '../src/internal/dialects/pg'
import { executeSelect as executeSqliteSelect } from '../src/internal/dialects/sqlite'

type SelectAdapter = (
  session: any,
  query: any,
  mapper: any,
  metadata: any,
  placeholderValues?: Record<string, unknown>
) => any

describe('dialect select adapters', () => {
  test.each([
    [
      'PostgreSQL',
      executePgSelect,
      ['query', 'arrays', false, 'mapper', 'metadata'],
      3,
      4,
    ],
    [
      'MySQL',
      executeMySqlSelect,
      ['query', 'arrays', 'mapper', 'metadata'],
      2,
      3,
    ],
    [
      'SQLite',
      executeSqliteSelect,
      ['query', 'arrays', false, 'all', 'mapper', 'metadata'],
      4,
      5,
    ],
  ] as [string, SelectAdapter, unknown[], number, number][])(
    '%s uses its prepareQuery signature',
    (_, adapter, args, mapperIndex, metadataIndex) => {
      const execute = vi.fn().mockReturnValue('result')
      const prepareQuery = vi.fn().mockReturnValue({ execute })
      const session = { prepareQuery }
      const placeholderValues = { id: 1 }

      expect(
        adapter(
          session,
          args[0],
          args[mapperIndex],
          args[metadataIndex],
          placeholderValues
        )
      ).toBe('result')
      expect(prepareQuery).toHaveBeenCalledWith(...args)
      expect(execute).toHaveBeenCalledWith(placeholderValues)
    }
  )
})
