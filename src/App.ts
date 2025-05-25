import {
  div,
  button,
  input,
  h1,
  $,
  derive$,
  state$,
  ChildExpression,
} from './lib'
import { MyButton } from './MyButton'
import { Observable } from 'rxjs'
import {TodoList} from "./TodoList";

export function App() {
  const count$ = state$(0)
  const isVisible$ = state$(false)
  const buttonText$ = state$('click me')

  function increment() {
    count$.set((val) => val + 1)
  }

  function toggleVisibility() {
    isVisible$.set((val) => !val)
  }

  function setButtonText(e: KeyboardEvent) {
    buttonText$.set((e.currentTarget as HTMLInputElement).value)
  }

  return div(
    { style: 'font-family: sans-serif;' },

    div(
      { onclick: increment },
      h1('Counter'),
      $`counter value: ${count$}`,
      button({ onclick: increment }, count$),
    ),

    div(
      h1('Toggle Visibility'),
      button({ onclick: toggleVisibility }, 'show/hide'),
      derive$(
        (isVisible, count) => {
          if (!isVisible) {
            return null
          } else if (count > 10) {
            return 'count is greater than 10'
          } else if (count > 0) {
            return 'count is less than 10'
          } else {
            return 'count is 0'
          }
        },
        [isVisible$, count$],
      ),
    ),

    div(
      h1('Subcomponent with reactive props'),
      div('the button is in the MyButton component'),
      input({
        onkeyup: setButtonText,
        value: buttonText$,
      }),
      MyButton({ buttonText$ }),
    ),

    TodoList()
  )
}
