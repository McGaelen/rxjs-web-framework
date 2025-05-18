/**
 * @returns {{
 *   register: (sub: SubscriptionOrEventListener) => void,
 *   destroy: () => void
 * }}
 */
export function registry() {
  /** @type {SubscriptionOrEventListener[]}*/
  const subs = []

  return {
    register(sub) {
      subs.push(sub)
    },
    destroy() {
      subs.forEach(sub => {
        if (sub.unsubscribe && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe()
        } else if (sub.ref && sub.eventProp) {
          sub.ref[sub.eventProp] = null
        }
      })
    }
  }
}
