import { button, div, each$, h1, input, li, map$, state$, ul } from './lib'

export function TodoList() {
  const description$ = state$('')
  const todos$ = state$([
    { id: 0, description: 'buy milk', done: false },
    { id: 1, description: 'buy eggs', done: true },
    { id: 2, description: 'buy bread', done: false },
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
        done: false,
      },
    ])
  }

  function addTodoToTop() {
    todos$.set$((todos) => [
      {
        id: getNewId(),
        description: description$.value,
        done: false,
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
    ul(
      { style: 'width: 200px;' },
      // staticArray.map(fruit => div(fruit)),
      // ['hello world ', description$],
      // $`some text in a $ statement`,
      map$(todos$, (todo) => ({
        key: todo.id,
        value: li(
          { style: 'display: flex; justify-content: space-between; gap: 5px;' },
          todo.description,
          button({ onclick: () => removeTodo(todo.id) }, 'remove'),
        ),
      })),

      // each$(todos$, (todo) => li(
      //           { style: 'display: flex; justify-content: space-between; gap: 5px;' },
      //           todo.description,
      //           button({ onclick: () => removeTodo(todo.id) }, 'remove'),
      //       )
      // ),

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
