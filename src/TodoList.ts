import {$, button, div, each$, f, flattenArrayOfObservables, h1, input, li, map$, span, state$, ul} from './lib'
import {combineLatest, combineLatestAll, mergeAll, Observable, OperatorFunction, pipe, switchAll} from "rxjs";

export function TodoList() {
  const description$ = state$('')
  const todos$ = state$([
    { id: 0, description: 'buy milk', done: state$(false) },
    { id: 1, description: 'buy eggs', done: state$(true) },
    { id: 2, description: 'buy bread', done: state$(false) },
  ])

  const staticArray = ['apple', 'banana', 'cherry']

  function setDescription(e: KeyboardEvent) {
    description$.set$((e.target as HTMLInputElement).value)
  }

  let serial = 3

  function getNewId() {
    serial++
    return serial
  }

  function addTodo() {
    todos$.set$((todos) => [
      ...todos,
      {
        id: getNewId(),
        description: description$.value,
        done: state$(false),
      },
    ])
  }

  function addTodoToTop() {
    todos$.set$((todos) => [
      {
        id: getNewId(),
        description: description$.value,
        done: state$(false),
      },
      ...todos,
    ])
  }

  function removeTodo(id: number) {
    todos$.set$((todos) => {
      const index = todos.findIndex((todo) => todo.id === id)
      return [...todos.slice(undefined, index), ...todos.slice(index + 1)]
    })
  }

  each$(todos$, (todo) =>
    f(todo.done.derive$(isDone => {
      if (isDone) {
        return div('done!')
      } else {
        return div('not done.')
      }
    }))
  ).subscribe(console.log)

  return div(
    h1('Todo list'),
    input({ value: description$, onkeyup: setDescription }),
    button({ onclick: addTodo }, 'Add todo'),
    button({ onclick: addTodoToTop }, 'Add todo to Top'),
    ul(
      { style: 'width: 400px;' },
      each$(todos$, (todo) =>
        f(
          todo.done.derive$(isDone => {
            if (isDone) {
              return div('done!')
            } else {
              return div('not done.')
            }
         })
        )
      )
      // map$(todos$, 'id', (todo) =>
      //   li(
      //     { style: 'display: flex; justify-content: space-between; gap: 5px;' },
      //     span(
      //       { style: 'display: flex; gap: 5px;' },
      //       button(
      //         { onclick: () => todo.done.set$((isDone) => !isDone) },
      //         'toggle done',
      //       ),
      //       todo.done.derive$((isDone) => span(isDone ? 'done!' : 'not done')),
      //     ),
      //     todo.description,
      //     button({ onclick: () => removeTodo(todo.id) }, 'remove'),
      //   ),
      // ),
      // TODO: fix having multiple other children along with an array not working
      // staticArray.map(fruit => div(fruit)),
      // ['hello world ', description$],
      // $`some text in a $ statement`,
    ),
  )
}
