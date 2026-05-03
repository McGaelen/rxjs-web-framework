import { button, derive$, li, span } from './lib'
import type { TodoItem } from './TodoList'

interface TodoItemProps {
  todo: TodoItem
  onRemoveTodo: (id: number) => void
}

export function TodoItem({ todo, onRemoveTodo }: TodoItemProps) {
  return li(
    { style: 'display: flex; justify-content: space-between; gap: 5px;' },
    span(
      { style: 'display: flex; gap: 5px;' },
      button(
        { onclick: () => todo.done.set((isDone) => !isDone) },
        'toggle done',
      ),
      derive$([todo.done], (isDone) => span(isDone ? 'done!' : 'not done')),
    ),
    todo.description,
    button({ onclick: () => onRemoveTodo(todo.id) }, 'remove'),
  )
}
