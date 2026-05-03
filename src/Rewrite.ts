import { state$ } from './lib'
import {
  $,
  button,
  css,
  div,
  h1,
  input,
  li,
  shadowRoot,
  span,
  ul,
} from './lib/rewrite'
import { max } from 'lodash-es'

export function Rewrite() {
  let todo$ = state$('')
  let isShown$ = state$(false)
  let useSerif$ = state$(false)
  let showTodos$ = state$(true)

  const todos$ = state$([
    { id: 0, description: 'buy milk', done: state$(false) },
    { id: 1, description: 'buy eggs', done: state$(true) },
    { id: 2, description: 'buy bread', done: state$(false) },
  ])

  return div([
    h1(['This is outside the shadowRoot']),
    div([
      shadowRoot({ mode: 'open' }, [
        h1(['Toggle CSS Rules']),
        button({ onclick: () => useSerif$.set(!useSerif$.value) }, [
          'Use Serif?',
        ]),
        span([$([useSerif$], () => (useSerif$.value ? 'On' : 'Off'))]),
        css`
          *:not(button) {
            font-family: ${useSerif$.derive((v) =>
              v ? 'serif' : 'sans-serif',
            )};
          }
        `,
        css`
          button {
            font-style: italic;
            font-size: 25px;
            color: red;
            background-color: darkblue;
          }
        `,

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

        h1(['Todo List']),
        input({ onkeyup: (e) => todo$.set(e.currentTarget.value) }),
        button(
          {
            onclick: () =>
              todos$.set(() => [
                ...todos$.value,
                {
                  id: max(todos$.value.map((todo) => todo.id))! + 1,
                  description: todo$.value,
                  done: state$(false),
                },
              ]),
          },
          ['Add Todo'],
        ),
        button(
          {
            onclick: () => showTodos$.set(!showTodos$.value),
          },
          ['Show/Hide Todos'],
        ),
        $([showTodos$], () =>
          showTodos$.value
            ? ul([
                $([todos$], () =>
                  todos$.value.map((todo) =>
                    li([
                      button(
                        { onclick: () => todo.done.set(!todo.done.value) },
                        ['toggle'],
                      ),
                      button(
                        {
                          onclick: () =>
                            todos$.set(
                              todos$.value.filter((t2) => t2.id !== todo.id),
                            ),
                        },
                        ['remove'],
                      ),
                      todo.id.toString(),
                      ' ',
                      todo.description,
                      ' ',
                      span({ style: 'font-weight: bold;' }, [
                        $([todo.done], () => [
                          todo.done.value ? 'done' : 'not done',
                        ]),
                      ]),
                    ]),
                  ),
                ),
              ])
            : '',
        ),
      ]),
    ]),
  ])
}
