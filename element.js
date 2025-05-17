import {IfControlFlowBuilder} from "./control.js";
import {registry} from "./utils.js";

/**
 * @param [attributes] {AttributeRecord<HTMLDivElement>}
 * @returns {ChildTaggedTemplateFn<HTMLDivElement>}
 */
export function div(attributes) {
  return createElement('div', attributes)
}

/**
 * @param [attributes] {AttributeRecord<HTMLButtonElement>}
 * @returns {ChildTaggedTemplateFn<HTMLButtonElement>}
 */
export function button(attributes) {
  return createElement('button', attributes)
}

/**
 * TODO: this doesn't handle removing event listeners or unsubscribing from observables!
 * @template Element
 * @param tag {string}
 * @param [attributes] {AttributeRecord<Element>}
 * @returns {ChildTaggedTemplateFn<Element>}
 */
export function createElement(tag, attributes) {
  const {register, destroy} = registry()

  const ref = document.createElement(tag)

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // if its a function, try to add it as an event listener
        ref[key] = value
        register({ref, eventProp: key})
      } else if (value.subscribe && typeof value.subscribe === 'function') {
        // if it has a subscribe function, it's probably an Observable
        register(
          value.subscribe(val => ref.setAttribute(key, val))
        )
      } else {
        // otherwise, it is probably just a static value, so set it normally
        ref.setAttribute(key, value)
      }
    })
  }

  return (strings, ...expressions) => {
    /** @type {ChildList} */
    const childList = []

    // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
    strings.forEach((str, idx) => {
      childList.push(str)
      if (expressions[idx]) {
        childList.push(expressions[idx])
      }
    })

    childList.forEach((child, idx) => {
      if (child instanceof IfControlFlowBuilder) {
        register(
          child.build().subscribe(val => appendOrReplaceChild(ref, idx, val))
        )
      } else if (child.subscribe && typeof child.subscribe === 'function') {
        register(
          child.subscribe(val => appendOrReplaceChild(ref, idx, val))
        )
      } else if (typeof child === 'string') {
        ref.appendChild(document.createTextNode(child))
      } else if (typeof child === 'function') {
        ref.appendChild(child())
      } else {
        ref.appendChild(child)
      }
    })

    ref._destroy = destroy

    return ref
  }
}

function appendOrReplaceChild(ref, idx, val) {
  const isNil = val === null || val === undefined

  if (isNil && ref.childNodes[idx]) {
    ref.childNodes[idx]._destroy?.()
    ref.removeChild(ref.childNodes[idx])
  }

  const node = val instanceof HTMLElement
      ? val
      : document.createTextNode(val?.toString() ?? val)

  if (ref.childNodes[idx]) {
    // Call the existing child node's teardown logic before we replace it with a new element
    ref.childNodes[idx]._destroy?.()
    ref.replaceChild(node, ref.childNodes[idx])
  } else {
    ref.appendChild(node)
  }
}
