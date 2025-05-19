import { Observable, SubscriptionLike } from 'rxjs'

export function isObservable<T>(val: any): val is Observable<T> {
  return val?.subscribe && typeof val?.subscribe === 'function'
}

export function isSubscription(val: any): val is SubscriptionLike {
  return val.unsubscribe && typeof val.unsubscribe === 'function'
}
