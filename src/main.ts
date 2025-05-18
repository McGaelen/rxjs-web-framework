import {div, button, input, h1, $, derive$, State, state$, ChildList} from './lib'

// TODO:
// component children (maybe with slots too?) should probably look the same as normal elements with a ChildTaggedTemplateFn
// async/promises/using fetch
// make the syntax not look like shit
// make a test page that does something more advanced than a counter
// support attributes that use back ticks with an observable somewhere within it

const count = state$(0)
const isVisible = state$(false)
const buttonText = state$('click me')

function increment() {
  count.set$(val => val + 1)
}

function MyComponent() {
  return div({ style: 'font-weight: bold; font-family: sans-serif;' }, $`
    ${div({ onclick: increment }, $`
      ${h1({}, $`Counter`)}
      counter value: ${count}
      ${button({onclick: increment}, $`${count}`)}
    `)}

    ${div({}, $`
      ${h1({}, $`toggle visibility`)}
      ${button({ onclick: () => isVisible.set$(val => !val)}, $`show/hide`)}
      ${
        derive$((isVisible, count) => {
          if (!isVisible) {
            return 'hidden'
          } else if (count > 10) {
            return 'count is greater than 10'
          } else if (count > 0) {
            return 'count is less than 10'
          } else {
            return 'count is 0'
          }
        }, [isVisible, count])
      }
    `)}

    ${div({}, $`
      ${h1({}, $`Subcomponent with reactive props:`)}
      ${div({}, $`the button is in the MyButton component`)}
      ${input({
        onkeyup: (e: KeyboardEvent) => buttonText.set$((e.currentTarget as HTMLInputElement).value),
        value: buttonText
      })}
      ${MyButton({ buttonText }, $`
        hello world from child prop
      `)}
    `)}
  `)
}

function MyButton(
    {buttonText, someOtherSlot}: {buttonText: State<string>, someOtherSlot?: ChildList},
    children?: ChildList
): HTMLButtonElement {
  function onclick() {
    alert(buttonText.value)
  }
  return button({ onclick }, $`
    ${buttonText}
    ${div({}, children)}
  `)
}

document.body.appendChild(MyComponent())
