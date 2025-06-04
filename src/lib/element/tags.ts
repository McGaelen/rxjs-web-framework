import { AttributeRecord, ChildExpression } from './types'
import { createElement } from './element'

export function div(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLDivElement {
  return createElement('div', attributes, ...children)
}

export function span(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLSpanElement {
  return createElement('span', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function ul(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLUListElement {
  return createElement('ul', attributes, ...children)
}

export function li(
  attributes?: AttributeRecord | ChildExpression,
  ...children: ChildExpression[]
): HTMLLIElement {
  return createElement('li', attributes, ...children)
}
