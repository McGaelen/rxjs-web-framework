import { $, button, li, span } from './lib'
import type { TodoItem } from './TodoList'

interface TodoItemProps {
  todo: TodoItem
  onRemoveTodo: (id: number) => void
}

export function TodoItem({ todo, onRemoveTodo }: TodoItemProps) {
  return li([
    button({ onclick: () => todo.done.set(!todo.done.value) }, ['toggle']),
    button(
      {
        onclick: () => onRemoveTodo(todo.id),
      },
      ['remove'],
    ),
    todo.id.toString(),
    ' ',
    todo.description,
    ' ',
    span({ style: 'font-weight: bold;' }, [
      $([todo.done], () => [todo.done.value ? 'done' : 'not done']),
    ]),
  ])
}
