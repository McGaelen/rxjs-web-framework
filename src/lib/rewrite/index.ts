import { combineLatest, Observable } from 'rxjs'
import { isNil } from 'lodash-es'
import { div } from './tags'

export * from './tags'

export type MaybeObservable<T> = T | Observable<T>
export type AttributeName = string
export type AttributeValue = string | ((e?: any) => void)
export type Child = HTMLElement | string | RxjsWFShadowRoot

export type Attributes = Record<AttributeName, MaybeObservable<AttributeValue>>
export type Children = MaybeObservable<Child>[]

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

function setAttr(
  parent: HTMLElement,
  name: AttributeName,
  value: AttributeValue,
) {
  if (typeof value === 'function') {
    // @ts-expect-error
    parent[name] = value // TODO how can we make addEventListener work?
  } else if (!isNil(value)) {
    parent.setAttribute(name, value.toString?.())
  }
}

function upsertChildren(parent: HTMLElement | ShadowRoot, children: Children) {
  for (const [idx, ch] of (children ?? []).entries()) {
    if (ch instanceof Observable) {
      ch.subscribe((current) => upsertChild(parent, idx, current))
    } else if (ch instanceof RxjsWFShadowRoot) {
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

function upsertChild(
  parent: HTMLElement | ShadowRoot,
  idx: number,
  child: Child,
) {
  const currentNode = parent.childNodes[idx]
  const newNode = createNode(child)

  if (currentNode) {
    parent.replaceChild(newNode, currentNode)
  } else {
    parent.appendChild(newNode)
  }
}

function createNode(val: Child): Node {
  return val instanceof HTMLElement ? val : document.createTextNode(val)
}

export function $(
  deps: Observable<any>[],
  fn: (vals: any[]) => Child[] | Child,
): HTMLElement {
  const container = div({ style: 'display: contents;' })

  combineLatest(deps).subscribe((vals) => {
    const children = fn(vals)
    const nodes = (Array.isArray(children) ? children : [children]).map((c) =>
      createNode(c),
    )
    container.replaceChildren(...nodes)
  })

  return container
}

class RxjsWFShadowRoot {
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
): RxjsWFShadowRoot {
  return new RxjsWFShadowRoot(params, children)
}
