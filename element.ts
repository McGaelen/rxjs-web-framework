import { registry } from "./utils.js"
import { isObservable } from "rxjs"

export function div(
  attributes?: AttributeRecord,
  // ...children: ChildList
): ChildTaggedTemplateFn<HTMLDivElement> {
  return createElement("div", attributes)
}

export function button(
  attributes?: AttributeRecord,
  // ...children: ChildList
): ChildTaggedTemplateFn<HTMLButtonElement> {
  return createElement("button", attributes)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement("input", attributes)()
}

export function h1(
  attributes?: AttributeRecord,
  // ...children: ChildList
): ChildTaggedTemplateFn<HTMLHeadingElement> {
  return createElement("h1", attributes)
}

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributes?: AttributeRecord,
  // children?: ChildList,
): ChildTaggedTemplateFn<HTMLElementTagNameMap[TagName]> {
  const { register, destroy } = registry()

  const ref: ReactiveHTMLElement<HTMLElementTagNameMap[TagName]> =
    document.createElement(tag)

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === "function") {
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

  return (strings, ...expressions) => {
    if (!strings) {
      return ref
    }

    const childList: ChildList = []

    // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
    strings.forEach((str, idx) => {
      childList.push(str)
      if (expressions[idx]) {
        childList.push(expressions[idx])
      }
    })

    childList.forEach((child, idx) => {
      if (isObservable(child)) {
        register(child.subscribe((val) => appendOrReplaceChild(ref, idx, val)))
      } else {
        appendOrReplaceChild(ref, idx, child)
      }
    })

    ref._destroy = destroy
    return ref
  }
}

// /**
//  * @param strings {string[]}
//  * @param expressions {...ChildList}
//  * @returns
//  */
// export function $(strings: string[], ...expressions: ChildList): ChildList {
//   const childList: ChildList = []
//
//   // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
//   strings.forEach((str, idx) => {
//     childList.push(str)
//     if (expressions[idx]) {
//       childList.push(expressions[idx])
//     }
//   })
//
//   return childList
// }

function appendOrReplaceChild(
  ref: HTMLElement,
  idx: number,
  val: ChildExpression,
) {
  const isNil = val === null || val === undefined
  const currentNode = ref.childNodes[idx] as ReactiveHTMLElement

  if (isNil && currentNode) {
    // if its nil and there is already a node at this idx, we need to remove it
    currentNode._destroy?.()
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
    currentNode._destroy?.()
    ref.replaceChild(node, currentNode)
  } else {
    ref.appendChild(node)
  }
}
