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
        let renderedChildren: Map<ChildKey, Node> | null = null

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

            if (!renderedChildren) {
              renderedChildren = new Map()
            }

            let usedKeys: ChildKey[] = []
            expr.entries().forEach(([key, value], innerIdx) => {
              const parentOffset = innerIdx + idx

              if (!isNil(value)) {
                if (!renderedChildren!.has(key)) {
                  console.log('creating new child: ', {key, parentOffset, value})
                  renderedChildren!.set(key, appendOrReplaceChild(ref, parentOffset, value))
                } else {
                  const node = renderedChildren!.get(key)!
                  const nodeIndex = Array.from(ref.childNodes).findIndex(pNode => pNode === node)
                  console.log('map already has this node: ', {key, parentOffset, value, node})
                  if (nodeIndex !== parentOffset) {
                    console.log('moving this node to a new index: ', {key, parentOffset, nodeIndex, value, node})
                    // removeChildNode(ref, childValue)
                    // insertBefore will automatically remove the node from its original location if it was already in the DOM
                    ref.insertBefore(node, ref.childNodes[parentOffset])
                  }
                }
                usedKeys.push(key)
              }

            })

            renderedChildren.entries().forEach(([key, node]) => {
              if (!usedKeys.includes(key)) {
                if (ref.contains(node)) {
                  // the node may not always be a child if it was replaced by appendOrReplaceChild.
                  // If it is a trailing node (i.e., the list of children got shorter, so it wasn't replaced),
                  // then we need to remove it from the DOM.
                  removeChildNode(ref, node)
                }
                renderedChildren!.delete(key)
              }
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
