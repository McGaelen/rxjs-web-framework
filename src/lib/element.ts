import { registry } from './registry'
import { isObservable } from 'rxjs'
import {
  AttributeRecord,
  ChildExpression,
  ChildExpressionOrObservable,
  ChildList,
  Children,
  HTMLElementWithTeardown,
} from './index'

export function div(
  attributes?: AttributeRecord | ChildExpressionOrObservable,
  ...children: Children
): HTMLDivElement {
  console.log({ attributes, children })
  return createElement('div', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | ChildExpressionOrObservable,
  ...children: Children
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | ChildExpressionOrObservable,
  ...children: Children
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributesOrChildExpression?: AttributeRecord | ChildExpressionOrObservable,
  ...children: Children
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
        if (typeof value === 'function') {
          // if its a function, try to add it as an event listener
          // @ts-expect-error TODO: improve the types here
          ref[key] = value
          register({ ref, eventProp: key })
        } else if (isObservable(value)) {
          register(value.subscribe((val) => ref.setAttribute(key, val)))
        } else {
          // otherwise, it is probably just a static value, so set it normally
          ref.setAttribute(key, value)
        }
      })
    }
  }

  if (children) {
    // Children can contain ChildLists, which are arrays of ChildExpressions - need to flatten those out so we just have a clean ChildList.
    const childList: ChildList = children.flat(1)

    childList.flat(1).forEach((child, idx) => {
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

function appendOrReplaceChild(
  ref: HTMLElement,
  idx: number,
  val: ChildExpression,
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
  val: unknown,
): val is ChildExpressionOrObservable {
  return (
    isObservable(val) ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    val instanceof HTMLElement
  )
}
