import path from 'node:path'
import $ from 'picospawn'

export async function setup() {
  await $('pnpm -s drizzle-kit push', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
}
