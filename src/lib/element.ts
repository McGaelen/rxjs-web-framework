import { registry } from './registry'
import { Observable } from 'rxjs'
import {
  AttributeBaseExpression,
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression,
  HTMLElementWithTeardown,
} from './index'
import { isObservable } from './utils'
import { isNil, range } from 'lodash-es'

type NonNullableChildBaseExpression = Exclude<
  ChildBaseExpression,
  null | undefined
>

export function div(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLDivElement {
  console.log({ attributes, children })
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

  // Right now we are taking an array and mapping each entry to a map.
  // But what if instead of trying to make that work, we just have the user specify a Map themselves?
  // (and we give them a convenient way to do it? maybe the map function should actually make a map?)
  // Basically, it should be the responsibility of state.ts to only fire for values that were updated, instead of createElement trying to figure that out.
  if (children) {
    children.flat(1).forEach((childExpr, idx) => {
      // handle reactive values
      if (isObservable(childExpr)) {
        let lastChildCount = 0 // save the prevous len
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
          } else if (!isNil(expr)) {
            appendOrReplaceChild(ref, idx, expr)
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
  val: NonNullableChildBaseExpression,
) {
  const isNil = val === null || val === undefined
  const currentNode = ref.childNodes[idx] as HTMLElementWithTeardown

  if (isNil && currentNode) {
    // if its nil and there is already a node at this idx, we need to remove it
    removeChildNode(ref, currentNode)
    return
  } else if (isNil) {
    // dont add it do the DOM if its nil
    return
  }

  const node = createNode(val)

  if (currentNode) {
    // Call the existing child node's teardown logic before we replace it with a new element
    currentNode._teardown?.()
    ref.replaceChild(node, currentNode)
  } else {
    ref.appendChild(node)
  }
}

function createNode(val: NonNullableChildBaseExpression): Node {
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

function removeChildNode(ref: HTMLElement, node: Node) {
  // @ts-expect-error who knows if the node has a teardown func, but we don't care if it doesn't, we just want to remove it
  node._teardown?.()
  ref.removeChild(node)
}
