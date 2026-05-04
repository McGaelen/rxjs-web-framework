import { Counter } from './Counter'
import { css, div, shadowRoot } from './lib'
import { TodoList } from './TodoList'
import { DynamicCSS } from './DynamicCSS'
import { Subcomponent } from './Subcomponent'

export function TestApp() {
  return div([
    Counter(),
    div(['This is outside the shadowRoot']),

    div([
      shadowRoot({ mode: 'open' }, [
        css`
          button {
            font-style: italic;
            font-size: 25px;
            color: red;
            background-color: darkblue;
          }
        `,

        DynamicCSS(),

        TodoList(),
      ]),
    ]),

    Subcomponent(),
    div(['This is outside the shadowRoot']),
  ])
}
