import { parse, walk } from 'svelte/compiler'
import MagicString from 'magic-string'

const PREFIX = ':'
const KEYWORDS = [
  'if',
  'else',
  'else-if',
  'each',
  'as',
  'key',
  'await',
  'then',
  'catch'
]

/**
 * @returns {import('svelte/types/compiler/preprocess').PreprocessorGroup}
 */
export function sveltePreprocessInlineLogic() {
  return {
    markup({ content, filename }) {
      const s = new MagicString(content)
      const ast = parse(content, { filename })
      const ROOT_PARENT = {}

      const depths = new WeakMap()

      walk(ast, {
        enter(node, parent) {
          if (node.type !== 'Element') return

          const key = parent || ROOT_PARENT
          if (!depths.has(key)) depths.set(key, {})

          const depth = depths.get(key)
          const keywords = getKeywords(node)

          function finalize() {
            if (depth.ifBlock) finalizeIf()
            if (depth.eachBlock) finalizeEach()
            if (depth.awaitBlock) finalizeAwait()
            if (depth.keyBlock) finalizeKey()
          }

          function finalizeIf() {
            const b = depth.ifBlock
            // TODO: move raw keyword value instead to preserve sourcemaps
            s.appendLeft(
              b.if.node.start,
              `{#if ${getKeywordValue(s, b.if.keyword)}}`
            )
            removeKeyword(s, b.if.keyword)

            if (b.elseIfs) {
              for (const elseIf of b.elseIfs) {
                s.appendLeft(
                  elseIf.node.start,
                  `{:else if ${getKeywordValue(s, elseIf.keyword)}}`
                )
                removeKeyword(s, elseIf.keyword)
              }
            }

            if (b.else) {
              s.appendLeft(b.else.node.start, `{:else}`)
              removeKeyword(s, b.else.keyword)
            }

            const last =
              b.else || (b.elseIfs && b.elseIfs[b.elseIfs.length - 1]) || b.if
            s.prependRight(last.node.end, `{/if}`)

            delete depth.ifBlock
          }

          function finalizeEach() {
            const b = depth.eachBlock

            if (b.key) {
              s.appendLeft(
                b.each.node.start,
                `{#each ${getKeywordValue(
                  s,
                  b.each.keyword
                )} as ${getKeywordValue(s, b.as.keyword)} (${getKeywordValue(
                  s,
                  b.key.keyword
                )})}`
              )
              removeKeyword(s, b.each.keyword)
              removeKeyword(s, b.as.keyword)
              removeKeyword(s, b.key.keyword)
            } else {
              s.appendLeft(
                b.each.node.start,
                `{#each ${getKeywordValue(
                  s,
                  b.each.keyword
                )} as ${getKeywordValue(s, b.as.keyword)}}`
              )
              removeKeyword(s, b.each.keyword)
              removeKeyword(s, b.as.keyword)
            }

            if (b.else) {
              s.appendLeft(b.else.node.start, `{:else}`)
              removeKeyword(s, b.else.keyword)
            }

            const last = b.else || b.each
            s.prependRight(last.node.end, `{/each}`)

            delete depth.eachBlock
          }

          function finalizeAwait() {
            const b = depth.awaitBlock

            if (b.then) {
              if (b.then.node === b.await.node) {
                s.appendLeft(
                  b.await.node.start,
                  `{#await ${getKeywordValue(
                    s,
                    b.await.keyword
                  )} then ${getKeywordValue(s, b.then.keyword)}}`
                )
              } else {
                s.appendLeft(
                  b.await.node.start,
                  `{#await ${getKeywordValue(s, b.await.keyword)}}`
                )
                s.appendLeft(
                  b.then.node.start,
                  `{:then ${getKeywordValue(s, b.then.keyword)}}`
                )
              }

              removeKeyword(s, b.await.keyword)
              removeKeyword(s, b.then.keyword)
            }

            if (b.catch) {
              if (b.catch.node === b.await.node) {
                if (b.catch.node === b.then?.node) {
                  throw new Error('TODO: Validate so this never happen')
                }

                s.appendLeft(
                  b.await.node.start,
                  `{#await ${getKeywordValue(
                    s,
                    b.await.keyword
                  )} catch ${getKeywordValue(s, b.catch.keyword)}}`
                )
              } else {
                if (!b.then) {
                  s.appendLeft(
                    b.await.node.start,
                    `{#await ${getKeywordValue(s, b.await.keyword)}}`
                  )
                }
                s.appendLeft(b.catch.node.start, `{:catch}`)
              }

              removeKeyword(s, b.await.keyword)
              removeKeyword(s, b.catch.keyword)
            }

            const last = b.catch || b.then || b.await
            s.prependRight(last.node.end, `{/await}`)

            delete depth.awaitBlock
          }

          function finalizeKey() {
            const b = depth.keyBlock
            s.appendLeft(
              b.key.node.start,
              `{#key ${getKeywordValue(s, b.key.keyword)}}`
            )
            s.prependRight(b.key.node.end, `{/key}`)
            removeKeyword(s, b.key.keyword)
            delete depth.keyBlock
          }

          for (const keyword of keywords) {
            const keywordKey = keyword.key.name.slice(PREFIX.length)
            switch (keywordKey) {
              case 'if':
                finalize()
                depth.ifBlock = { if: { node, keyword } }
                break
              case 'else-if':
                if (depth.ifBlock) {
                  if (!depth.ifBlock.elseIfs) depth.ifBlock.elseIfs = []
                  depth.ifBlock.elseIfs.push({ node, keyword })
                } else {
                  finalize()
                }
                break
              case 'else':
                if (depth.ifBlock) {
                  depth.ifBlock.else = { node, keyword }
                } else if (depth.eachBlock) {
                  depth.eachBlock.else = { node, keyword }
                }
                finalize()
                break
              case 'each':
                finalize()
                depth.eachBlock = { each: { node, keyword } }
                break
              case 'as':
                if (depth.eachBlock && depth.eachBlock.each.node === node) {
                  depth.eachBlock.as = { node, keyword }
                }
                break
              case 'key':
                if (depth.eachBlock && depth.eachBlock.each.node === node) {
                  depth.eachBlock.key = { node, keyword }
                } else {
                  finalize()
                  depth.keyBlock = { key: { node, keyword } }
                }
                break
              case 'await':
                finalize()
                depth.awaitBlock = { await: { node, keyword } }
                break
              case 'then':
                if (depth.awaitBlock) {
                  depth.awaitBlock.then = { node, keyword }
                }
                break
              case 'catch':
                if (depth.awaitBlock) {
                  depth.awaitBlock.catch = { node, keyword }
                }
                finalize()
                break
              default:
                finalize()
                break
            }
          }

          if (parent.children.indexOf(node) === parent.children.length - 1) {
            finalize()
          }
        }
      })

      return {
        code: s.toString(),
        map: s.generateMap()
      }
    }
  }
}

function getKeywords(node) {
  return (node.attributes || [])
    .filter(
      (v) =>
        v.name.startsWith(PREFIX) &&
        KEYWORDS.includes(v.name.slice(PREFIX.length))
    )
    .map((v) => {
      let m
      if (v.value === true) {
        m = { name: true }
      } else {
        m = v.value.find((w) => w.type === 'MustacheTag').expression
      }
      return {
        key: {
          name: v.name,
          start: v.start,
          end: v.end
        },
        value: {
          name: m.name,
          start: m.start,
          end: m.end
        }
      }
    })
}

function getKeywordValue(s, keyword) {
  if (keyword.value.name === true) {
    return 'true'
  } else {
    return s.slice(keyword.value.start, keyword.value.end)
  }
}

function removeKeyword(s, keyword) {
  const start = keyword.key.start
  const end = keyword.key.end
  s.remove(start, end)
}
