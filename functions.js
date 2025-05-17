import { BehaviorSubject } from "rxjs";

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

  // TODO: i think all of `children` needs to be an observable to support conditionally rendering children...
  // TODO: use a tagged template for children that can create that observable
  return (strings, ...expressions) => {
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
        child.subscribe(val => {
          const textNode = document.createTextNode(val?.toString() ?? val)
          if (ref.childNodes[idx]) {
            ref.replaceChild(textNode, ref.childNodes[idx])
          } else {
            ref.appendChild(textNode)
          }
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

/**
 * @template T
 * @returns {State<T>}
 */
export function state(initialVal) {
  const obs = new BehaviorSubject(initialVal)

  obs.$set = (newVal) => {
    if (typeof newVal === 'function') {
      const returnedVal = newVal(obs.value)
      obs.next(returnedVal)
    } else {
      obs.next(newVal)
    }
  }

  return obs
}
