import { isSubscription } from './utils'
import {RegisterFn, SubscriptionOrEventListener} from "./types";

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
