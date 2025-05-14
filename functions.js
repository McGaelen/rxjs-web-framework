import {Observable} from "rxjs";

/**
 * @returns HTMLDivElement
 */
export function div(attributes, children) {
  const ref = document.createElement('div')

  Object.entries(attributes).forEach(([key, value]) => {
    ref.setAttribute(key, value)
  })

  children.forEach(child => {
    if (typeof child === 'string') {
      ref.appendChild(document.createTextNode(child))
    } else {
      ref.appendChild(child)
    }
  })
}

/**
 * @returns {Observable<any> & {$set: (newVal: any) => void}}
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
