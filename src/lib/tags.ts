import { createElement } from './index'

export function div(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLDivElement {
  return createElement('div', attributes, children)
}

export function span(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLSpanElement {
  return createElement('span', attributes, children)
}

export function button(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLButtonElement {
  return createElement('button', attributes, children)
}

export function input(attributes?: Attributes): HTMLInputElement {
  return createElement('input', attributes)
}

export function h1(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLHeadingElement {
  return createElement('h1', attributes, children)
}

export function ul(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLUListElement {
  return createElement('ul', attributes, children)
}

export function li(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLLIElement {
  return createElement('li', attributes, children)
}

export function style(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLStyleElement {
  return createElement('style', attributes, children)
}

export function template(
  attributes?: Attributes | Children,
  children?: Children,
): HTMLTemplateElement {
  return createElement('template', attributes, children)
}
