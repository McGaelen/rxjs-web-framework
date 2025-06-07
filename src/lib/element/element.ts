import { RegisterFn, registry } from '../registry'
import { Observable } from 'rxjs'
import {
  AttributeRecord,
  ChildValue,
  Child,
  ChildNodeWithKey,
  HTMLElementWithTeardown, ReactiveChild, ChildKey,
} from './types'
import { isNil, range } from 'lodash-es'
import {
  addOrReplaceAttribute,
  appendOrReplaceChild,
  createNode,
  removeChildAtIdx,
  removeChildNode,
} from './dom'
import { isChildExpressionOrObservable, isObservable } from './utils'

export function createElement<TagName extends keyof HTMLElementTagNameMap>(
  tag: TagName,
  attributesOrChildExpression?: AttributeRecord | Child,
  ...children: Child[]
): HTMLElementTagNameMap[TagName] {
  const { register, destroy } = registry()

  const ref: HTMLElementWithTeardown<HTMLElementTagNameMap[TagName]> =
    document.createElement(tag)
  ref._teardown = destroy

  if (attributesOrChildExpression) {
    if (isChildExpressionOrObservable(attributesOrChildExpression)) {
      // Since it's the first argument, we want it to be the first child
      children.unshift(attributesOrChildExpression)
    } else {
      handleAttributes(ref, attributesOrChildExpression, register)
    }
  }

  if (children) {
    children.flat(1).forEach((childExpr, idx) => {
      // handle reactive values
      if (isObservable(childExpr)) {
        handleReactiveChild(ref, childExpr, idx)
      } else if (!isNil(childExpr)) {
        // handle static values
        appendOrReplaceChild(ref, idx, childExpr)
      } // ignore null or undefined values
    })
  }

  return ref
}

export function $(
  strings: TemplateStringsArray,
  ...expressions: Array<ChildValue | Observable<ChildValue>>
): Child {
  const childList: Child = []

  // Collect all the strings and expressions into a chronological list so we can keep them in the order they were added
  strings.forEach((str, idx) => {
    childList.push(str)
    if (expressions[idx]) {
      childList.push(expressions[idx])
    }
  })

  return childList
}

function handleAttributes(
  ref: HTMLElement,
  attributes: AttributeRecord,
  registerFn: RegisterFn,
) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (isObservable(value)) {
      registerFn(value.subscribe((val) => addOrReplaceAttribute(ref, key, val)))
    } else {
      addOrReplaceAttribute(ref, key, value)
    }
  })
}

function handleReactiveChild(ref: HTMLElement, child: ReactiveChild, idx: number) {
  // if it's an array, save the previous length so we know how many elements to potentially prune
  let lastChildCount = 0

  child.subscribe((source) => {
    if (Array.isArray(source)) {
      lastChildCount = handleReactiveArray(ref, idx, source, lastChildCount)
    } else if (source instanceof Map) {
      handleMap(ref, idx, source)
    } else if (!isNil(source)) {
      appendOrReplaceChild(ref, idx, source)
    } else {
      // Can't just ignore nil expressions here, since they could become nil at a later point,
      // we will need to remove any that do end up becoming nil.
      removeChildAtIdx(ref, idx)
    }
  })
}

function handleReactiveArray(ref: HTMLElement, idx: number, source: Array<ChildValue>, lastChildCount: number): number {
  let nils = 0
  source.forEach((innerChild, innerIdx) => {
    if (isNil(innerChild)) {
      nils++
    } else {
      appendOrReplaceChild(ref, innerIdx + idx - nils, innerChild)
    }
  })

  if (source.length < lastChildCount) {
    range(source.length, lastChildCount).forEach((idx) =>
        removeChildNode(ref, ref.childNodes[idx]),
    )
  }

  return source.length
}

function handleMap(ref: HTMLElement, idx: number, source: Map<ChildKey, ChildValue>) {
  const exprEntries = source.entries().toArray()

  const max = Math.max(ref.childNodes.length, source.size)

  range(max).forEach((loopIdx) => {
    console.log('looping', max)
    const parentOffset = idx + loopIdx

    const exprEntry = exprEntries.at(parentOffset)
    const sourceKey = exprEntry?.[0]
    const sourceValue = exprEntry?.[1]
    const node = ref.childNodes[parentOffset] as ChildNodeWithKey

    /**
     * Scenarios (must take into account both index and key)
     * 1. Value exists in source, in dom, and their keys match.
     *    - noop
     * 2. Value exists in source, but there is no dom element at this index.
     *    - Add the value to the dom.
     * 3. Value exists in source, and there is a dom element at this index, but their keys do not match.
     *    - Check if the existing dom element here exists in the source at all. If not, remove it. If it does, noop.
     *    - Check the dom for an existing node with this key. If it exists, move it to this index. If it doesn't, create it.
     * 4. Value doesn't exist in source at the index, but there is an element in the dom at this index whose key DOES exist in the source at a different index.
     *    - already covered in 3
     * 5. Value doesn't exist in source at the index, but there is an element in the dom at this index whose key DOES NOT exist in the source at all.
     *    - already covered in 3
     * 6. Value doesn't exist in the source at the index, and there is no element in the dom at this index.
     *    - noop
     */

        const info = {
          loopIdx,
          sourceKey,
          sourceValue,
          node,
          nodeKey: node?._key,
        }

    const sourceExists = !isNil(sourceKey) && !isNil(sourceValue)
    if (sourceExists && node && sourceKey === node._key) {
      console.log('correct keys - noop', info)
    } else  if (sourceExists && !node) {
      const newNode = appendOrReplaceChild(
          ref,
          parentOffset,
          sourceValue,
      ) as ChildNodeWithKey
      newNode._key = sourceKey
      console.log('missing node - creating', info)
    } else if (sourceExists && node && sourceKey !== node._key) {
      if (!source.has(node._key)) {
        removeChildNode(ref, node)
        console.log(
          'key mismatch, and node here is not in the source - deleting',
          info,
        )
      }

      // Check if there's already a ChildNode for this key.
      let existingNode: Node | ChildNode | undefined = ref.childNodes
          .values()
          .find(
              (pNode) => (pNode as ChildNodeWithKey)._key === sourceKey,
          )
      if (existingNode) {
        ref.insertBefore(existingNode, ref.childNodes[parentOffset])
        console.log(
          'existing node for this key is in dom - moving to this index',
          info,
        )
      } else {
        const newNode = createNode(sourceValue) as ChildNodeWithKey
        newNode._key = sourceKey
        ref.insertBefore(newNode, ref.childNodes[parentOffset])
        console.log(
          'no existing node found for this key - creating new node',
          info,
        )
      }
    } else if (
        !sourceKey &&
        !sourceValue &&
        node &&
        !source.has(node._key)
    ) {
      removeChildNode(ref, node)
      console.log(
        'node exists here but is not in source - deleting',
        info,
      )
    } else {
      console.log(
        'missed scenario, or list was shortened in place',
        info,
      )
    }
  })
}
