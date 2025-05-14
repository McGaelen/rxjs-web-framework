/**
 * @param strings {Array<string>}
 * @param expressions {Array<any>}
 *
 * @returns HTMLElement
 */
export function html(strings, ...expressions) {
  let uninterpolated = strings[0]

  for (const [idx, expr] of expressions.entries()) {
    uninterpolated += `{{{${idx}}}}${strings[idx + 1]}`
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
  console.log(parsed.body)
  // loop through all the DOM in the parsed document and create the elements manually
  // OR, loop through all the DOM in the parsed document, find where there are attrs or children that are expressions, then update them to the expression.
}

/**
 * @param string {string}
 * @param expressions {Array<any>}
 */
// function parseHtml(string, expressions) {
//   /** @type {Array<{tag: string, attrs: Record<string, any>, children: Array<any>}>} */
//   const tags = [];
//   let currentIndex = 0;
//
//   while (currentIndex < string.length) {
//     const tagStart = string.indexOf('<', currentIndex) + 1;
//     const attrStart = string.slice(tagStart).search(/\s/) + tagStart + 1;
//     const childrenStart = string.indexOf('>', attrStart);
//
//   }
//
//   return tags;
//   /* Output:
//   [
//       {
//           tagName: 'div',
//           attributes: { class: 'container' },
//           content: 'Hello'
//       },
//       {
//           tagName: 'span',
//           attributes: { id: 'msg' },
//           content: 'World'
//       }
//   ]
//   */
// }

/**
 * @param tag {string}
 * @param attrs {Record<string, any>}
 * @param children {Array<any>}
 *
 * @returns HTMLElement
 */
// function createElement(tag, attrs, children) {
//   const el = document.createElement(tag)
//
//   console.log(attrs)
//   for (const [key, value] of Object.entries(attrs)) {
//     el.setAttribute(key, value)
//   }
//
//   for (const child of children) {
//     if (typeof child === 'string') {
//       el.appendChild(document.createTextNode(child))
//     } else {
//       el.appendChild(child)
//     }
//   }
//
//   return el
// }
