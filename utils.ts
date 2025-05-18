import { Observable, SubscriptionLike } from "rxjs"

export type RegisterFn = (sub: SubscriptionOrEventListener) => void

export function registry(): { register: RegisterFn; destroy: VoidFunction } {
  const subs: SubscriptionOrEventListener[] = []

  return {
    register(sub: SubscriptionOrEventListener) {
      subs.push(sub)
    },
    destroy() {
      subs.forEach((sub) => {
        if (isSubscription(sub)) {
          sub.unsubscribe()
        } else if (sub.ref && sub.eventProp) {
          // @ts-expect-error
          sub.ref[sub.eventProp] = null
        }
      })
    },
  }
}

export function isObservable<T>(val: any): val is Observable<T> {
  return val?.subscribe && typeof val?.subscribe === "function"
}

export function isSubscription(val: any): val is SubscriptionLike {
  return val.unsubscribe && typeof val.unsubscribe === "function"
}
