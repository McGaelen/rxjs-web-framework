import { AttributeBaseExpression, ChildValue } from './types'

type _NonNullableChildBaseExpression = Exclude<ChildValue, null | undefined>

export function addOrReplaceAttribute(
  ref: HTMLElement,
  key: string,
  value: AttributeBaseExpression,
) {
  if (typeof value === 'function') {
    // if its a function, try to add it as an event listener
    // @ts-expect-error TODO: improve the types here
    ref[key] = value
  } else if (value !== null && value !== undefined) {
    ref.setAttribute(key, value.toString())
  }
}

export function appendOrReplaceChild(
  ref: HTMLElement,
  idx: number,
  val: _NonNullableChildBaseExpression,
): Node {
  const currentNode = ref.childNodes[idx]
  const newNode = createNode(val)

  if (currentNode) {
    // Call the existing child node's teardown logic before we replace it with a new element
    // @ts-expect-error
    currentNode._teardown?.()
    ref.replaceChild(newNode, currentNode)
  } else {
    ref.appendChild(newNode)
  }

  return newNode
}

export function createNode(val: _NonNullableChildBaseExpression): Node {
  return val instanceof HTMLElement
    ? val
    : document.createTextNode(val?.toString() ?? val)
}

export function removeChildAtIdx(ref: HTMLElement, idx: number) {
  if (ref.childNodes[idx]) {
    removeChildNode(ref, ref.childNodes[idx])
  }
}

export function removeChildNode(ref: HTMLElement, node: Node) {
  // @ts-expect-error who knows if the node has a teardown func, but we don't care if it doesn't, we just want to remove it
  node._teardown?.()
  ref.removeChild(node)
}
