import {Observable, catchError, BehaviorSubject} from "rxjs";

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

  // TODO: i think all of `children` needs to be an observable to support conditionally rendering children...
  // TODO: use a tagged template for children that can create that observable
  if (!children) return ref
  if (tag === 'button') {
    debugger
  }

  for (const [idx, child] of children.entries()) {
    if (child.subscribe && typeof child.subscribe === 'function') {
      // TODO: for some reason the subscribe method doesn't get called when the element reading it is a child?
      child.subscribe({
        next: val => {
          if (tag === 'button') {
            debugger
          }
          const textNode = document.createTextNode(val?.toString() ?? val)
          if (ref.childNodes[idx]) {
            ref.replaceChild(textNode, ref.childNodes[idx])
          } else {
            ref.appendChild(textNode)
          }
        },
        complete() {
          console.log('complete')
        }
      })
    } else if (typeof child === 'string') {
      ref.appendChild(document.createTextNode(child))
    } else {
      ref.appendChild(child)
    }
  }
  // children.forEach((child, idx) => {
  //
  // })


  return ref
}

/**
 * @returns {BehaviorSubject<any> & { $set: (newVal: any) => void }}
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
