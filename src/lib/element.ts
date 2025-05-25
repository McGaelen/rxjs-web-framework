import { registry } from './registry'
import {of, combineLatest, Observable, map, mergeAll, combineLatestAll} from 'rxjs'
import {
  AttributeBaseExpression,
  AttributeRecord,
  ChildBaseExpression,
  ChildExpression, FragmentElementBuilder,
  HTMLElementWithTeardown,
} from './index'
import {isObservable} from "./utils";
import {range} from "lodash-es";

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
          register(value.subscribe((val) => addOrReplaceAttribute(ref, key, val)))
        } else {
          addOrReplaceAttribute(ref, key, value)
        }
      })
    }
  }

  let childMap = new Map<number | string, HTMLElement>()

  /**
   * try this:
   * add a fragment element that doesn't add dom, but still manages it's children
   * add an `each$()` function to state.ts that maps an array inside of a fragment and takes a key
   *    - i don't like this because it means that state$ has to be coupled to doing HTML/DOM things, when it really should just be a simple wrapper around an observable
   * fragment handles updating only children that changed
   */
  f(...children)(ref, 0)
  // if (children) {
  //   let lastLength = 0
  //   // TODO: do something smarter so this doesn't look like shit
  //   combineLatest(
  //       // flat(1) to handle static arrays, just by flattening them out
  //       children.flat(1).map(c => isObservable(c) ? c : of(c))
  //   ).pipe(
  //       map(childs => combineLatest(childs.flat(1).map(c => isObservable(c) ? c : of(c)))),
  //       mergeAll()
  //   ).subscribe(childs => {
  //     // TODO: this needs to:
  //     // TODO: 1) remove trailing elements when length differs
  //     // TODO: 2) use keyed elements
  //     // TODO: 3) only update elements that changed - currently it just re-adds EVERYTHING.
  //     childs.forEach((child, idx) => appendOrReplaceChild(ref, idx, child))
  //     if (childs.length < lastLength) {
  //       range(childs.length, lastLength).forEach(idx => {
  //         const node = ref.childNodes[idx] as HTMLElementWithTeardown
  //         node._teardown?.()
  //         ref.removeChild(node)
  //       })
  //     }
  //     lastLength = childs.length
  //   })
  // }

  return ref
}



export function f(...children: ChildExpression[]): FragmentElementBuilder {
  return (parentRef, startOffset) => {
    if (children) {
      let lastLength = 0
      // TODO: do something smarter so this doesn't look like shit
      // TODO: also it's bugged because if there are 0 elements, it doesn't fire at all, so the last orphan node is never removed.
      combineLatest(
          // flat(1) to handle static arrays, just by flattening them out
          children.flat(1).map(c => isObservable(c) ? c : of(c))
      ).pipe(
          map(childs => combineLatest(childs.flat(1).map(c => isObservable(c) ? c : of(c)))),
          mergeAll()
      ).subscribe(childs => {
        // TODO: this needs to:
        // TODO: 1) remove trailing elements when length differs
        // TODO: 2) use keyed elements
        // TODO: 3) only update elements that changed - currently it just re-adds EVERYTHING.
        childs.forEach((child, idx) => {
          if (typeof child === 'function') {
            child(parentRef, idx)
          } else {
            appendOrReplaceChild(parentRef, idx + startOffset, child)
          }
        })
        console.log('FIRING!!!')
        if (childs.length < lastLength) {
          range(childs.length, lastLength).forEach(idx => {
            const node = parentRef.childNodes[idx + startOffset] as HTMLElementWithTeardown
            node._teardown?.()
            parentRef.removeChild(node)
          })
        }
        lastLength = childs.length
      })
    }
  }
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
      /** Check for all types in {@link Primitive}, except for null and undefined */
      ['number', 'bigint', 'boolean', 'string'].includes(typeof val) ||
      val instanceof HTMLElement ||
      Array.isArray(val) ||
      isObservable(val) // AttributeRecords themselves cannot be observables, only AttributeValues can
  )
}
