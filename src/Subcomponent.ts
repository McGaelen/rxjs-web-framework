import { div, h1, input, state$ } from './lib'
import { MyButton } from './MyButton'

export function Subcomponent() {
  const buttonText$ = state$('click me')

  function setButtonText(e: KeyboardEvent) {
    buttonText$.set((e.currentTarget as HTMLInputElement).value)
  }

  return div([
    h1(['Subcomponent with reactive props']),
    div(['the button is in the MyButton component']),
    input({
      onkeyup: setButtonText,
      value: buttonText$,
    }),
    MyButton({ buttonText$ }),
  ])
}
