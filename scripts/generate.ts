import { emitGeneratedFiles } from '../src/codegen/emit'

console.log('Generating...')

emitGeneratedFiles({
  noRemove: process.argv.includes('--no-remove'),
})
