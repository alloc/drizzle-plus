import type { Dialect } from './registry'

export type Feature = {
  name: string
  source: string
  dialects: readonly Dialect[]
}

export const features = [
  feature('$cursor'),
  feature('$findMany'),
  feature('$select'),
  feature('$values'),
  feature('$withMaterialized', ['pg']),
  feature('$withRecursive'),
  feature('$without'),
  feature('as'),
  feature('count'),
  feature('create', ['pg']),
  feature('findManyAndCount'),
  feature('findUnique'),
  feature('fromSingle'),
  feature('internal'),
  feature('orThrow'),
  feature('types'),
  feature('updateMany'),
  feature('upsert', ['pg', 'sqlite']),
  feature('withoutFrom'),
] as const satisfies readonly Feature[]

function feature(
  name: string,
  dialects: readonly Dialect[] = ['pg', 'mysql', 'sqlite']
): Feature {
  return {
    name,
    source: `src/extensions/${name}.ts`,
    dialects,
  }
}
