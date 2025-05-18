import {registry} from "./utils.js";

/**
 * @param [attributes] {AttributeRecord}
 * @returns {ChildTaggedTemplateFn<HTMLDivElement>}
 */
export function div(attributes) {
  return createElement('div', attributes)
}

/**
 * @param [attributes] {AttributeRecord}
 * @returns {ChildTaggedTemplateFn<HTMLButtonElement>}
 */
export function button(attributes) {
  return createElement('button', attributes)
}

/**
 * @param [attributes] {AttributeRecord}
 * @returns {HTMLInputElement}
 */
export function input(attributes) {
  return createElement('input', attributes)()
}

/**
 * @param [attributes] {AttributeRecord}
 * @returns {ChildTaggedTemplateFn<HTMLHeadingElement>}
 */
export function h1(attributes) {
  return createElement('h1', attributes)
}

/**
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
    if (!strings) {
      return ref
    }

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
      if (child.subscribe && typeof child.subscribe === 'function') {
        register(
          child.subscribe(val => appendOrReplaceChild(ref, idx, val))
        )
      } else {
        appendOrReplaceChild(ref, idx, child)
      }
    })

    ref._destroy = destroy

    return ref
  }
}

function appendOrReplaceChild(ref, idx, val) {
  const isNil = val === null || val === undefined

  if (isNil && ref.childNodes[idx]) {
    // if its nil and there is already a node at this idx, we need to remove it
    ref.childNodes[idx]._destroy?.()
    ref.removeChild(ref.childNodes[idx])
    return
  } else if (isNil) {
    // dont add it do the DOM if its nil
    return
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
