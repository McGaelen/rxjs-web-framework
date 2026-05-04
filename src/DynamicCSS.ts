import { $, button, css, derive$, div, h1, span, state$ } from './lib'

export function DynamicCSS() {
  let useSerif$ = state$(false)
  return div([
    h1(['Toggle CSS Rules']),
    button({ onclick: () => useSerif$.set(!useSerif$.value) }, ['Use Serif?']),
    span([$([useSerif$], () => (useSerif$.value ? 'On' : 'Off'))]),
    css`
      *:not(button) {
        font-family: ${derive$([useSerif$], (v) =>
          v ? 'serif' : 'sans-serif',
        )};
      }
    `,
  ])
}
