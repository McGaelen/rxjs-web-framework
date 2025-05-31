import { registry } from './registry'
import { Observable } from 'rxjs'
import {
  AttributeBaseExpression,
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression, ChildKey,
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

        childExpr.subscribe((expr) => {

          if (Array.isArray(expr)) {

            let nils = 0
            expr.forEach((innerChild, innerIdx) => {
              if (isNil(innerChild)) {
                nils++
              } else {
                appendOrReplaceChild(ref, innerIdx + idx - nils, innerChild)
              }
            })

            if (expr.length < lastChildCount) {
              range(expr.length, lastChildCount).forEach((idx) =>
                removeChildNode(ref, ref.childNodes[idx]),
              )
            }
            lastChildCount = expr.length

          } else if (expr instanceof Map) {

            const exprEntries = expr.entries().toArray()
            // const renderedEntries = renderedChildren.entries().toArray()
            const max = Math.max(ref.childNodes.length, expr.size)
            range(max).forEach((loopIdx) => {
              const parentOffset = idx + loopIdx

              const exprEntry = exprEntries.at(parentOffset)
              const sourceKey = exprEntry?.[0]
              const sourceValue = exprEntry?.[1]
              const node = ref.childNodes[parentOffset]

              // if (!exprEntry && !node) {
              //   return // no work to do
              // }
              //
              // if (!sourceKey && node) {
              //   // An element was removed from the bottom of the list.
              //   // There is no entry in the source at this index, so remove our child node at the index.
              //   removeChildNode(ref, node)
              // } else if (sourceKey && !node) {
              //   // An element was added to the bottom of the list.
              //   // We don't have a node at this index, so create one.
              //   const newNode = appendOrReplaceChild(ref, parentOffset, exprEntry[1]!)
              //   newNode._key = exprEntry[0]!
              // } else if (sourceKey !== node._key) {
                // The keys are different, which can mean one of three things:
                // 1. The key was moved to a different location.
                // 2. The key was removed from the middle or top of the list.
                // 3. The key was added to the middle or top of the list
                if (sourceKey && sourceValue && !ref.childNodes.values().find(pNode => pNode._key === sourceKey)) {
                  // We know it was added because we currently don't have it in the dom.
                  // Add it here. TODO: handle case when sourceValue is null.
                  const newNode = appendOrReplaceChild(ref, parentOffset, sourceValue)
                  newNode._key = sourceKey
                } else if (node && !expr.has(node._key)) {
                  removeChildNode(ref, node)
                } /*else if (node && expr.has(node._key)) {
                  // We know it was moved because the source still contains it,
                  // so grab its new index and do insertBefore()
                  ref.insertBefore(node, ref.childNodes[parentOffset])
                }*/ else {
                  ref.insertBefore(node, ref.childNodes[parentOffset])
                  // The element was deleted from the source, so remove it.
                  // removeChildNode(ref, node)
                }
              // }
            })

          } else if (!isNil(expr)) {
            appendOrReplaceChild(ref, idx, expr)
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
