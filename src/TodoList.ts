import {button, div, each$, h1, input, li, map$, state$, ul} from './lib'

export function TodoList() {
  const description$ = state$('')
  const todos$ = state$([
    { id: 0, description: 'buy milk', done: false },
    { id: 1, description: 'buy eggs', done: true },
  ])

  const staticArray = ['apple', 'banana', 'cherry']

  function setDescription(e: KeyboardEvent) {
    description$.set$((e.target as HTMLInputElement).value)
  }

  function addTodo() {
    todos$.set$((todos) => [
      ...todos,
      {
        id: todos.length,
        description: description$.value,
        done: false,
      },
    ])
  }

  function addTodoToTop() {
    todos$.set$((todos) => [
      {
        id: todos.length,
        description: description$.value,
        done: false,
      },
      ...todos,
    ])
  }

  function removeTodo(index: number) {
    todos$.set$((todos) => [
      ...todos.slice(undefined, index),
      ...todos.slice(index + 1),
    ])
  }

  return div(
    h1('Todo list'),
    input({ value: description$, onkeyup: setDescription }),
    button({ onclick: addTodo }, 'Add todo'),
    button({ onclick: addTodoToTop }, 'Add todo to Top'),
    ul(
      { style: 'width: 200px;' },
      // staticArray.map(fruit => div(fruit)),
      // ['hello world ', description$],
      // $`some text in a $ statement`,
      map$(todos$, (todo, idx) => ({
        key: todo.id,
        value: li(
            { style: 'display: flex; justify-content: space-between; gap: 5px;' },
            todo.description,
            button({ onclick: () => removeTodo(idx) }, 'remove'),
          ),
        })
      ),

      // TODO: this should work too, but it doesnt!!!!!!
      // todos$.derive((todos) =>
      //   todos.length === 0
      //     ? 'No todos!'
      //     : each$(todos$, (todo, idx) =>
      //         li(
      //           {
      //             style:
      //               'display: flex; justify-content: space-between; gap: 5px;',
      //           },
      //           todo.description,
      //           button({ onclick: () => removeTodo(idx) }, 'remove'),
      //         ),
      //       ),
      // ),
    ),
  )
}
