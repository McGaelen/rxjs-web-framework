import { registry } from './registry'
import { Observable } from 'rxjs'
import {
  AttributeBaseExpression,
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression,
  ChildKey,
  HTMLElementWithTeardown,
} from './index'
import { isObservable } from './utils'
import { isNil, range } from 'lodash-es'

type _NonNullableChildBaseExpression = Exclude<
  ChildBaseExpression,
  null | undefined
>

export function div(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLDivElement {
  return createElement('div', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function ul(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLUListElement {
  return createElement('ul', attributes, ...children)
}

export function li(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLLIElement {
  return createElement('li', attributes, ...children)
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributesOrChildExpression?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLElementTagNameMap[TagName] {
  const { register, destroy } = registry()

  const ref: HTMLElementWithTeardown<HTMLElementTagNameMap[TagName]> =
    document.createElement(tag)
  ref._teardown = destroy

  if (attributesOrChildExpression) {
    if (isChildExpressionOrObservable(attributesOrChildExpression)) {
      // Since it's the first argument, we want it to be the first child
      children.unshift(attributesOrChildExpression)
    } else {
      Object.entries(attributesOrChildExpression).forEach(([key, value]) => {
        if (isObservable(value)) {
          register(
            value.subscribe((val) => addOrReplaceAttribute(ref, key, val)),
          )
        } else {
          addOrReplaceAttribute(ref, key, value)
        }
      })
    }
  }

  if (children) {
    children.flat(1).forEach((childExpr, idx) => {
      // handle reactive values
      if (isObservable(childExpr)) {
        // if it's an array, save the previous length so we know how many elements to potentially prune
        let lastChildCount = 0
        // if it's a map, we keep a constant record of which nodes are currently in the DOM,
        // with a unique key of the user-provided\ key plus the index in the list.
        // That means the key will change if a new element is swapped into place, or if an element is repositioned to a new index.
        // let renderedChildren: Map<ChildKey, Node> | null = null

        childExpr.subscribe((source) => {
          if (Array.isArray(source)) {
            let nils = 0
            source.forEach((innerChild, innerIdx) => {
              if (isNil(innerChild)) {
                nils++
              } else {
                appendOrReplaceChild(ref, innerIdx + idx - nils, innerChild)
              }
            })

            if (source.length < lastChildCount) {
              range(source.length, lastChildCount).forEach((idx) =>
                removeChildNode(ref, ref.childNodes[idx]),
              )
            }
            lastChildCount = source.length
          } else if (source instanceof Map) {
            const exprEntries = source.entries().toArray()
            // const renderedEntries = renderedChildren.entries().toArray()
            const max = Math.max(ref.childNodes.length, source.size)

            console.log({max, source})
            range(max).forEach((loopIdx) => {
              console.log('looping')
              const parentOffset = idx + loopIdx

              const exprEntry = exprEntries.at(parentOffset)
              const sourceKey = exprEntry?.[0]
              const sourceValue = exprEntry?.[1]
              const node = ref.childNodes[parentOffset]

              /**
               * Scenarios (must take into account both index and key)
               * 1. Value exists in source, in dom, and their keys match.
               *    - noop
               * 2. Value exists in source, but there is no dom element at this index.
               *    - Add the value to the dom.
               * 3. Value exists in source, and there is a dom element at this index, but their keys do not match.
               *    - Check if the existing dom element here exists in the source at all. If not, remove it. If it does, noop.
               *    - Check the dom for an existing node with this key. If it exists, move it to this index. If it doesn't, create it.
               * 4. Value doesn't exist in source at the index, but there is an element in the dom at this index whose key DOES exist in the source at a different index.
               *    - already covered in 3
               * 5. Value doesn't exist in source at the index, but there is an element in the dom at this index whose key DOES NOT exist in the source at all.
               *    - already covered in 3
               * 6. Value doesn't exist in the source at the index, and there is no element in the dom at this index.
               *    - noop
               */

              const info = {
                loopIdx,
                sourceKey,
                sourceValue,
                node,
                nodeKey: node?._key,
              }

              const sourceExists = !isNil(sourceKey) && !isNil(sourceValue)
              if (sourceExists && node && sourceKey === node._key) {
                  // noop
                  console.log('correct keys - noop', info)

                } else if (sourceExists && !node) {
                const newNode = appendOrReplaceChild(
                  ref,
                  parentOffset,
                  sourceValue,
                )
                newNode._key = sourceKey
                console.log('missing node - creating', info)
              } else if (sourceExists && node && sourceKey !== node._key) {
                if (!source.has(node._key)) {
                  removeChildNode(ref, node)
                  console.log(
                    'key mismatch, and node here is not in the source - deleting',
                    info,
                  )
                }

                // Check if there's already a ChildNode for this key.
                let existingNode: Node | ChildNode | undefined = ref.childNodes
                  .values()
                  .find((pNode) => pNode._key === sourceKey)
                if (existingNode) {
                  ref.insertBefore(existingNode, ref.childNodes[parentOffset])
                  console.log(
                    'existing node for this key is in dom - moving to this index',
                    info,
                  )
                } else {
                  const newNode = createNode(sourceValue)
                  newNode._key = sourceKey
                  ref.insertBefore(newNode, ref.childNodes[parentOffset])
                  console.log(
                    'no existing node found for this key - creating new node',
                    info,
                  )
                }
              } else if (
                !sourceKey &&
                !sourceValue &&
                node &&
                !source.has(node._key)
              ) {
                removeChildNode(ref, node)
                console.log(
                  'node exists here but is not in source - deleting',
                  info,
                )
              }  else {
                  console.log('missed scenario, or list was shortened in place', info)
                }
            })
          } else if (!isNil(source)) {
            appendOrReplaceChild(ref, idx, source)
          } else {
            // Can't just ignore nil expressions here, since they could become nil at a later point,
            // we will need to remove any that do end up becoming nil.
            removeChildAtIdx(ref, idx)
          }
        })
      } else if (!isNil(childExpr)) {
        // handle static values
        appendOrReplaceChild(ref, idx, childExpr)
      } // ignore null or undefined values
    })
  }

  return ref
}

export function $(
  strings: TemplateStringsArray,
  ...expressions: Array<ChildBaseExpression | Observable<ChildBaseExpression>>
): ChildExpression {
  const childList: ChildExpression = []

  // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
  strings.forEach((str, idx) => {
    childList.push(str)
    if (expressions[idx]) {
      childList.push(expressions[idx])
    }
  })

  return childList
}

function addOrReplaceAttribute(
  ref: HTMLElement,
  key: string,
  value: AttributeBaseExpression,
) {
  if (typeof value === 'function') {
    // if its a function, try to add it as an event listener
    // @ts-expect-error TODO: improve the types here
    ref[key] = value
  } else if (value !== null && value !== undefined) {
    ref.setAttribute(key, value.toString())
  }
}

function appendOrReplaceChild(
  ref: HTMLElement,
  idx: number,
  val: _NonNullableChildBaseExpression,
): Node {
  const currentNode = ref.childNodes[idx]
  const newNode = createNode(val)

  if (currentNode) {
    // Call the existing child node's teardown logic before we replace it with a new element
    // @ts-expect-error
    currentNode._teardown?.()
    ref.replaceChild(newNode, currentNode)
  } else {
    ref.appendChild(newNode)
  }

  return newNode
}

function createNode(val: _NonNullableChildBaseExpression): Node {
  return val instanceof HTMLElement
    ? val
    : document.createTextNode(val?.toString() ?? val)
}

function isChildExpressionOrObservable(
  val: AttributeRecord | ChildExpression,
): val is ChildExpression {
  return (
    /** Check for all types in {@link Primitive}, except for null and undefined */
    ['number', 'bigint', 'boolean', 'string'].includes(typeof val) ||
    val instanceof HTMLElement ||
    Array.isArray(val) ||
    isObservable(val) // AttributeRecords themselves cannot be observables, only AttributeValues can
  )
}

function removeChildAtIdx(ref: HTMLElement, idx: number) {
  if (ref.childNodes[idx]) {
    removeChildNode(ref, ref.childNodes[idx])
  }
}

function removeChildNode(ref: HTMLElement, node: Node) {
  // @ts-expect-error who knows if the node has a teardown func, but we don't care if it doesn't, we just want to remove it
  node._teardown?.()
  ref.removeChild(node)
}
