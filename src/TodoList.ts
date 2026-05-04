import { max } from 'lodash-es'
import { $, button, div, h1, input, li, span, State, state$, ul } from './lib'
import { TodoItem } from './TodoItem'

export interface TodoItem {
  id: number
  description: string
  done: State<boolean>
}

export function TodoList() {
  const description$ = state$('')
  const todos$ = state$([
    { id: 0, description: 'buy milk', done: state$(false) },
    { id: 1, description: 'buy eggs', done: state$(true) },
    { id: 2, description: 'buy bread', done: state$(false) },
  ])
  const showTodos$ = state$(true)

  function setDescription(e: KeyboardEvent) {
    description$.set((e.target as HTMLInputElement).value)
  }

  function getNewId() {
    return max(todos$.value.map((todo) => todo.id))! + 1
  }

  function addTodo() {
    todos$.set((todos) => [
      ...todos,
      {
        id: getNewId(),
        description: description$.value,
        done: state$(false),
      },
    ])
  }

  function addTodoToTop() {
    todos$.set((todos) => [
      {
        id: getNewId(),
        description: description$.value,
        done: state$(false),
      },
      ...todos,
    ])
  }

  function removeTodo(id: number) {
    todos$.set((todos) => {
      const index = todos.findIndex((todo) => todo.id === id)
      return [...todos.slice(undefined, index), ...todos.slice(index + 1)]
    })
  }

  todos$.subscribe(console.log)

  return div([
    h1(['Todo List']),
    input({ onkeyup: setDescription }),
    button({ onclick: addTodo }, ['Add Todo']),
    button({ onclick: addTodoToTop }, ['Add Todo Top']),
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
                TodoItem({ todo, onRemoveTodo: (id) => removeTodo(id) }),
              ),
            ),
          ])
        : '',
    ),
  ])
}
