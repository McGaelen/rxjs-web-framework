import { Observable } from 'rxjs'
import { State } from '../state'

export function html(
  strings: TemplateStringsArray,
  ...expressions: any[]
): HTMLElement {
  let linked = ''
  for (const [idx, str] of strings.entries()) {
    linked += str

    if (!expressions[idx]) {
      continue
    }

    let expr = expressions[idx]

    if (typeof expr === 'function') {
      expr = expr()
    }

    switch (typeof expr) {
      case 'string':
        linked += expr
        break
      case 'object':
        if (expr instanceof HTMLElement) {
          //
        } else if (expr instanceof Observable) {
          //
        } else if (Array.isArray(expr)) {
          linked += expr.join('')
        }
        break
    }
  }

  const parser = new DOMParser()
  return parser.parseFromString(linked, 'text/html').body
}

export class Dyn {}

export function dyn(): Dyn {
  // Represents a fragment of html that needs to be re-rendered when it's dependencies change
}

// need something to help with even handlers
