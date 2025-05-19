import { button, State } from './lib'

export function MyButton({
  buttonText$,
}: {
  buttonText$: State<string>
}): HTMLButtonElement {
  function onclick() {
    alert(buttonText$.value)
  }
  return button({ onclick }, buttonText$)
}
