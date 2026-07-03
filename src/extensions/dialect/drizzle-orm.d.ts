declare module 'drizzle-orm' {
  export function getColumns<T extends { _: { columns: Record<string, any> } }>(
    table: T
  ): T['_']['columns']
}
