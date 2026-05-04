import { AttributeRecord, Child } from './types'
import { createElement } from './element'

export function div(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLDivElement {
  return createElement('div', attributes, ...children)
}

export function span(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLSpanElement {
  return createElement('span', attributes, ...children)
}

export function button(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLButtonElement {
  return createElement('button', attributes, ...children)
}

export function input(attributes?: AttributeRecord): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLHeadingElement {
  return createElement('h1', attributes, ...children)
}

export function ul(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLUListElement {
  return createElement('ul', attributes, ...children)
}

export function li(
  attributes?: AttributeRecord | Child,
  ...children: Child[]
): HTMLLIElement {
  return createElement('li', attributes, ...children)
}
