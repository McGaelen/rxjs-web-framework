import {Observable} from "rxjs";

/**
 * TODO: this doesn't handle removing event listeners or unsubscribing from observables!
 *
 * @param tag {string}
 * @param [attributes] {Record<string, Observable<string> | string | (() => (any | void))>}
 * @param [children] {Array<string | HTMLElement | Observable<string | HTMLElement>>}
 * @returns HTMLDivElement
 */
export function el(tag, attributes, children) {
  const ref = document.createElement(tag)

  // don't actually need to save these on the ref object, but probably not
  ref._attributeObservers = {}
  ref._attributeSubscriptions = {}

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'function') {
        // if its a function, try to add it as an event listener
        ref.addEventListener(key, value)
      } else if (value.subscribe && typeof value.subscribe === 'function') {
        // if it has a subscribe function, it's probably an Observable
        ref._attributeObservers[key] = value
      } else {
        // otherwise, it is probably just a static value, so set it normally
        ref.setAttribute(key, value)
      }
    })

    // Subscribe to all observer attributes
    Object.keys(ref._attributeObservers).forEach(key => {
      ref._attributeSubscriptions[key] = ref._attributeObservers[key].subscribe(
        val => ref.setAttribute(key, val)
      )
    })
  }

  if (children) {
    // TODO: support Observables
    children.forEach((child, idx) => {
      if (child.subscribe && typeof child.subscribe === 'function') {
        child.subscribe(val => {
          ref.children[idx] = val
        })
      } else if (typeof child === 'string') {
        ref.appendChild(document.createTextNode(child))
      } else {
        ref.appendChild(child)
      }
    })
  }

  return ref
}

/**
 * @returns {Observable<any> & { $set: (newVal: any) => void }}
 */
export function state(initialVal) {
  let subscriber
  const obs = new Observable(psubscriber => {
    subscriber = psubscriber
    subscriber.next(initialVal)
  })

  let lastVal = initialVal
  obs.$set = (newVal) => {
    if (typeof newVal === 'function') {
      const returnedVal = newVal(lastVal)
      subscriber.next(returnedVal)
      lastVal = returnedVal
    } else {
      subscriber.next(newVal)
      lastVal = newVal
    }
  }

  return obs
}
