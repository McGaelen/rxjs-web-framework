import {
  $,
  button,
  derive$,
  div,
  h1,
  input,
  li,
  map$,
  span,
  State,
  state$,
  ul,
} from './lib'
import { TodoItem } from './TodoItem'

export interface TodoItem {
  id: number
  description: string
  done: State<boolean>
}

export function TodoList() {
  const description$ = state$('')
  const todos$: State<TodoItem[]> = state$([
    { id: 0, description: 'buy milk', done: state$(false) },
    { id: 1, description: 'buy eggs', done: state$(true) },
    { id: 2, description: 'buy bread', done: state$(false) },
  ])
  const showTodos$ = state$(false)

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

  todos$.subscribe(console.log)

  return div(
    h1('Todo list'),
    input({ value: description$, onkeyup: setDescription }),
    button({ onclick: addTodo }, 'Add todo'),
    button({ onclick: addTodoToTop }, 'Add todo to Top'),
    div(
      button(
        { onclick: () => showTodos$.set$(!showTodos$.value) },
        'show/hide todos',
      ),
    ),
    ul(
      { style: 'width: 400px;' },
      derive$([showTodos$], () => {
        if (showTodos$.value) {
          return map$(todos$, 'id', (todo) =>
            TodoItem({ todo, onRemoveTodo: removeTodo }),
          )
        } else {
          // TODO: this is temporary because createElement currently doesn't take an Observable<void>
          return div('hi')
        }
      }),

      // TODO: fix having multiple other children along with an array not working
      // staticArray.map(fruit => div(fruit)),
      // ['hello world ', description$],
      // $`some text in a $ statement`,
    ),
  )
}
