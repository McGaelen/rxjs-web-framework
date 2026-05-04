import { $, button, div, h1, state$ } from './lib'

export function ToggleVisibility() {
  let isShown$ = state$(false)

  return div([
    h1(['Toggle Visibility']),
    button(
      {
        onclick: () => isShown$.set(!isShown$.value),
      },
      ['Show/Hide'],
    ),

    div([
      $([isShown$], () => {
        if (isShown$.value) {
          return ['yo dawg']
        } else {
          return []
        }
      }),
    ]),
  ])
}
