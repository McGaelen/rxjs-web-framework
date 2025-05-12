/**
 * @param strings {Array<string>}
 * @param expressions {Array<any>}
 *
 * @returns HTMLElement
 */
export function html(strings, ...expressions) {
  let uninterpolated = strings[0]

  for (const [idx, expr] of expressions.entries()) {
    uninterpolated += `$${idx}${strings[idx + 1]}`
  }

  // we essentially need to take the template and compile it on the fly
  // basically, a JIT compiler that takes in a tagged template and spits out
  // the javascript that would need to run for each expression to be updated in the dom.
  //
  // attributes would call setAttribute
  // children would call appendChild
  //
  // and then the template would have to be entirely recreated, probably using DOMParser,
  // and a reference to the element that would have setAttribute or appendChild called on it
  // would need to be saved.


  const parsed = new DOMParser().parseFromString(uninterpolated, 'text/html')

  for (const [idx, expr] of expressions.entries()) {
    let text
    let attr = parsed.body.querySelector(`[=$${idx}]`)
    if (!attr) {
      // instead of doing this, we should probably just parse the whole string and create elements manually
      text = parsed.evaluate('')
    }
  }

  return parsed
}

function createElement(tag, attrs, children) {

}
