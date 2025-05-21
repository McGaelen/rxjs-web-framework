import { button, div, h1, input, li, ul } from './element'
import { state$ } from './state'

interface TodoItem {
  id: number
  description: string
  isDone: boolean
}

export function TodoList() {
  const todoList$ = state$<TodoItem[]>([
    // { id: 1, description: 'do the dishes', isDone: false },
  ])
  let description = ''

  function addTodo() {
    todoList$.set((todos) => [
      ...todos,
      {
        id: todos.length,
        description,
        isDone: false,
      },
    ])
  }

  function setDescription(e: KeyboardEvent) {
    description = (e.currentTarget as HTMLInputElement).value
  }

  return div(
    h1('Todo List'),
    input({ placeholder: 'todo description', onkeyup: setDescription }),
    button({ onclick: addTodo }, 'add todo'),
    ul(
      li('hello world'),
      todoList$.derive((todos) =>
        todos.map((todo) =>
          li(
            todo.description,
            'done? ',
            input({
              type: 'checkbox',
              value: todo.isDone ? 'checked' : '',
              onchange: (e) => {
                todoList$.set((ftodos) => {
                  const ftodo = ftodos.find((ftodo) => ftodo.id === todo.id)
                  ftodo.isDone = (e as Event).target.value
                  return ftodos
                })
              },
            }),
          ),
        ),
      ),
    ),
  )
}
