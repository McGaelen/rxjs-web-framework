import { registry } from './registry'
import { isObservable } from 'rxjs'
import {
  AttributeBaseExpression,
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression,
  ChildList,
  HTMLElementWithTeardown,
} from './index'

export function div(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildList
): HTMLDivElement {
  console.log({ attributes, children })
  return createElement('div', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildList
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildList
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributesOrChildExpression?: AttributeRecord | ChildExpression,
  ...children: ChildList
): HTMLElementTagNameMap[TagName] {
  const { register, destroy } = registry()

  const ref: HTMLElementWithTeardown<HTMLElementTagNameMap[TagName]> =
    document.createElement(tag)

  if (attributesOrChildExpression) {
    if (isChildExpressionOrObservable(attributesOrChildExpression)) {
      // Since it's the first argument, we want it to be the first child
      children.unshift(attributesOrChildExpression)
    } else {
      Object.entries(attributesOrChildExpression).forEach(([key, value]) => {
        if (isObservable(value)) {
          register(value.subscribe((val) => addOrReplaceAttribute(ref, key, val)))
        } else {
          addOrReplaceAttribute(ref, key, value)
        }
      })
    }
  }

  if (children) {
    children.flat(1).forEach((child, idx) => {
      if (isObservable(child)) {
        register(child.subscribe((val) => appendOrReplaceChild(ref, idx, val)))
      } else {
        appendOrReplaceChild(ref, idx, child)
      }
    })
  }

  ref._teardown = destroy

  return ref
}

export function $(
  strings: TemplateStringsArray,
  ...expressions: ChildList
): ChildList {
  const childList: ChildList = []

  // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
  strings.forEach((str, idx) => {
    childList.push(str)
    if (expressions[idx]) {
      childList.push(expressions[idx])
    }
  })

  return childList
}

function addOrReplaceAttribute(ref: HTMLElement, key: string, value: AttributeBaseExpression) {
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
  val: ChildBaseExpression,
) {
  const isNil = val === null || val === undefined
  const currentNode = ref.childNodes[idx] as HTMLElementWithTeardown

  if (isNil && currentNode) {
    // if its nil and there is already a node at this idx, we need to remove it
    currentNode._teardown?.()
    ref.removeChild(currentNode)
    return
  } else if (isNil) {
    // dont add it do the DOM if its nil
    return
  }

  const node =
    val instanceof HTMLElement
      ? val
      : document.createTextNode(val?.toString() ?? val)

  if (currentNode) {
    // Call the existing child node's teardown logic before we replace it with a new element
    currentNode._teardown?.()
    ref.replaceChild(node, currentNode)
  } else {
    ref.appendChild(node)
  }
}

function isChildExpressionOrObservable(
  val: AttributeRecord | ChildExpression,
): val is ChildExpression {
  return (
      isObservable(val) || // AttributeRecords themselves cannot be observables, only AttributeValues can
      val instanceof HTMLElement ||
      /** Check for all types in {@link Primitive}, except for null and undefined */
      ['number', 'bigint', 'boolean', 'string'].includes(typeof val)
  )
}
