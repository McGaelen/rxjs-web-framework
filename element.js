import { BehaviorSubject } from "rxjs";
import {IfControlFlowBuilder} from "./control.js";

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
  const ref = document.createElement(tag)

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // if its a function, try to add it as an event listener
        ref[key] = value
      } else if (value.subscribe && typeof value.subscribe === 'function') {
        // if it has a subscribe function, it's probably an Observable
        value.subscribe(val => ref.setAttribute(key, val))
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
        child.build().subscribe(val => {
          appendOrReplaceChild(ref, idx, val)
        })
      } else if (child.subscribe && typeof child.subscribe === 'function') {
        child.subscribe(val => {
          appendOrReplaceChild(ref, idx, val)
        })
      } else if (typeof child === 'string') {
        ref.appendChild(document.createTextNode(child))
      } else if (typeof child === 'function') {
        ref.appendChild(child())
      } else {
        ref.appendChild(child)
      }
    })

    return ref
  }
}

function appendOrReplaceChild(ref, idx, val) {
  const node = val instanceof HTMLElement
      ? val
      : document.createTextNode(val?.toString() ?? val)

  if (ref.childNodes[idx]) {
    ref.replaceChild(node, ref.childNodes[idx])
  } else {
    ref.appendChild(node)
  }
}
