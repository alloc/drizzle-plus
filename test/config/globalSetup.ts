import path from 'node:path'
import $ from 'picospawn'

export async function setup() {
  const drizzleKit = path.resolve(
    __dirname,
    '../../node_modules/drizzle-kit/bin.cjs'
  )
  await $(`node ${drizzleKit} push`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
}
