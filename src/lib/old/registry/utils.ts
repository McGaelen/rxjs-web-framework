import { SubscriptionLike } from 'rxjs'

export function isSubscription(val: any): val is SubscriptionLike {
  return val.unsubscribe && typeof val.unsubscribe === 'function'
}
