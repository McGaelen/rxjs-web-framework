import { isNil } from 'lodash-es'

export function setAttr(
  el: HTMLElement,
  name: AttributeName,
  value: AttributeValue,
) {
  if (typeof value === 'function') {
    // @ts-expect-error
    el[name] = value // TODO how can we make addEventListener work?
  } else if (!isNil(value)) {
    el.setAttribute(name, value.toString?.())
  }
}

export function upsertChild(
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

export function createNode(val: Child): Node {
  return val instanceof HTMLElement ? val : document.createTextNode(val)
}
