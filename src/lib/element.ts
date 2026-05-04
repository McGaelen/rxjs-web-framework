import { combineLatest, map, Observable } from 'rxjs'
import { createNode, setAttr, upsertChild } from './dom'
import { style } from './tags'

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attrs?: Attributes | Children,
  children?: Children,
): HTMLElementTagNameMap[TagName] {
  const el = document.createElement(tag)

  // if `attrs` is an array, then we treat it as a list of children and skip setting attributes.
  if (Array.isArray(attrs)) {
    children = attrs
  } else {
    for (const [attr, val] of Object.entries(attrs ?? {})) {
      if (val instanceof Observable) {
        val.subscribe((current) => setAttr(el, attr, current))
      } else {
        setAttr(el, attr, val)
      }
    }
  }

  upsertChildren(el, children ?? [])

  return el
}

export class ShadowRootBuilder {
  #params: ShadowRootInit
  #children?: Children
  constructor(params: ShadowRootInit, children?: Children) {
    this.#params = params
    this.#children = children
  }

  init(parent: HTMLElement) {
    const shadowRoot = parent.attachShadow(this.#params)
    upsertChildren(shadowRoot, this.#children ?? [])
  }
}

export function shadowRoot(
  params: ShadowRootInit,
  children?: Children,
): ShadowRootBuilder {
  return new ShadowRootBuilder(params, children)
}

export function $(
  deps: Observable<any>[],
  fn: (vals: any[]) => Child[] | Child,
): HTMLElement {
  const container = createElement('div', { style: 'display: contents;' })

  combineLatest(deps).subscribe((vals) => {
    const children = fn(vals)
    const nodes = (Array.isArray(children) ? children : [children]).map((c) =>
      createNode(c),
    )
    container.replaceChildren(...nodes)
  })

  return container
}

export function css(
  strings: TemplateStringsArray,
  ...expressions: Observable<string>[]
): HTMLElement {
  if (!expressions.length) return style([strings[0]])

  const styleText$ = combineLatest(expressions).pipe(
    map((exprs) => {
      let text = ''
      strings.forEach((str, idx) => {
        text += str
        if (exprs[idx]) {
          text += exprs[idx]
        }
      })
      return text
    }),
  )
  return $([styleText$], ([styleText]) => style([styleText]))
}

function upsertChildren(parent: HTMLElement | ShadowRoot, children: Children) {
  for (const [idx, ch] of children.entries()) {
    if (ch instanceof Observable) {
      ch.subscribe((current) => upsertChild(parent, idx, current))
    } else if (ch instanceof ShadowRootBuilder) {
      if (!(parent instanceof ShadowRoot)) {
        ch.init(parent)
      } else {
        throw new Error(
          'A shadowRoot cannot be a direct child of another shadowRoot. Wrap the shadowRoot in an HTMLElement instead.',
        )
      }
    } else {
      upsertChild(parent, idx, ch)
    }
  }
}
