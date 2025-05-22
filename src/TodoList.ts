import {button, div, h1, input, li, state$, ul} from './lib'

export function TodoList() {
  const description$ = state$('')
  const todos$ = state$([
    { id: 0, description: 'buy milk', done: false },
    { id: 1, description: 'buy eggs', done: true },
  ])

  function setDescription(e: KeyboardEvent) {
    description$.set((e.target as HTMLInputElement).value)
  }

  function addTodo() {
    todos$.set((todos) => [
      ...todos,
      {
        id: todos.length,
        description: description$.value,
        done: false,
      },
    ])
  }

  function removeTodo(index: number) {
    todos$.set((todos) => [
      ...todos.slice(undefined, index),
      ...todos.slice(index + 1),
    ])
  }

  // TODO: dom elements aren't removed when removed from the array
  return div(
    h1('Todo list'),
    input({ value: description$, onkeyup: setDescription }),
    button({ onclick: addTodo }, 'Add todo'),
    ul(
      todos$.map((val, idx) =>
        li(
          { style: 'display: flex; gap: 5px;'},
          val.description,
          button({ onclick: () => removeTodo(idx) }, 'remove'),
        ),
      ),
    ),
  )
}
