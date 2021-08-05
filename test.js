import fs from 'fs/promises'
import { preprocess } from 'svelte/compiler'
import { sveltePreprocessInlineLogic } from './index.js'

main()

async function main() {
  const input = await fs.readFile('Input.svelte', 'utf8')
  const result = await preprocess(input, sveltePreprocessInlineLogic())
  await fs.writeFile('Output.svelte', result.code, 'utf8')
}
