import { registry } from './registry'
import { isObservable } from './utils'
import {
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression,
  ChildList,
  Children,
  HTMLElementWithTeardown,
} from './index'
import { Observable } from 'rxjs'

export function div(
  attributes?: AttributeRecord | ChildExpression,
  ...children: Children
): HTMLDivElement {
  console.log({ attributes, children })
  return createElement('div', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | ChildExpression,
  ...children: Children
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | ChildExpression,
  ...children: Children
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function ul(
  attributes?: AttributeRecord | ChildExpression,
  ...children: Children
): HTMLUListElement {
  return createElement('ul', attributes, ...children)
}

export function li(
  attributes?: AttributeRecord | ChildExpression,
  ...children: Children
): HTMLLIElement {
  return createElement('li', attributes, ...children)
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributesOrChildExpression?: AttributeRecord | ChildExpression,
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
    const childList = children.flat(1)

    childList.forEach((child, idx) => {
      if (isObservable(child)) {
        register(
          (
            child as Observable<ChildExpression> | Observable<ChildExpression[]>
          ).subscribe((childVal: ChildExpression | ChildExpression[]) => {
            if (Array.isArray(childVal)) {
              // TODO: we can't use the idx of the childVal array, because it will start at 0 again, and clobber elements appended earlier.
              // TODO: probably should only take an array of observables, which will get flattened out using the existing logic.
              // TODO: if we get an observable of an array, we should just
              childVal.forEach((val, childIdx) =>
                appendOrReplaceChild(ref, childIdx + idx, val),
              )
            } else {
              appendOrReplaceChild(ref, idx, childVal)
            }
          }),
        )
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

function isChildExpressionOrObservable(val: unknown): val is ChildExpression {
  return (
    isObservable(val) ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    val instanceof HTMLElement
  )
}
