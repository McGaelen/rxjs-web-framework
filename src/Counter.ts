import { $, button, derive$, div, h1, state$ } from './lib'

export function Counter() {
  let count$ = state$(0)

  function increment() {
    count$.set(count$.value + 1)
  }

  return div([
    h1(['Counter']),
    'counter value: ',
    $([count$], () => count$.value.toString()),
    button({ onclick: increment }, ['increment']),
  ])
}
