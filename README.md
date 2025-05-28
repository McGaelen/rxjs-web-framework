# What's the simplest web UI framework/library you can make without using compilers or transpilers?

This repo is an exploration into how far you can get only using the vanilla web platform - no compilers, no transpilers, no syntax that is outside of normal HTML/CSS/JS.

Most people still want some abstraction above the vanilla DOM API (because it kinda sucks), but some still want to _use the platform_ - it should be as easy as possible to make reactive web apps, but with the least amount of abstraction possible. Most frameworks answer make that happen using compilers or special syntax (or a combination of the two), which can be really clean/concise/readable and have really cool features - it makes sense that they'd go that direction.

But what if you didn't do that? What if you just had good ole' functions and HTML elements? What if your function component returned just an HTMLElement instead of a ReactNode? (Something you already know how to use just by learning the platform.) You can re-use your existing knowledge of the platform, or if you are a beginner, using the framework _helps you learn the platform_, which is transferable knowledge vs. knowledge of how a specific framework works.

By minimizing the amount of constructs you have to learn, it makes it easier to get into web development for someone who might be a lay-person or someone who's making a website as a secondary responsibility and doesn't have time to learn a specific framework.

# Todo List

- [x] element builder
- [x] state$ using rxjs
- [x] make the syntax not look like shit
- [x] conditional rendering
- [x] derived state
- [x] for loops
- [ ] keyed for loops
- [ ] nested derives/for loops (which would cause infinitely higher-order observables...)
- [ ] component children (maybe with slots too?) should probably look the same as normal elements
  - this probably already works the same as element functions but hasn't been tested
- [ ] allow an object for style attribute
- [ ] scope styles - `style()` fn that takes a string and creates styles scoped to all children of the element that it was defined in
- [ ] async/promises/using fetch
- [ ] make a test page that does something more advanced than a counter
- [ ] support attributes that use back ticks with an observable somewhere within it
  - can we reuse $`` for this?
- [ ] deep reactivity for objects (probably need proxies for this)

## for loops

- We want the ability to pass an array of children that can dynamically change as elements are added, removed, edited, or repositioned, and to have it be performant and avoid duplicating work.
  - To pass a dynamic array, we'll have to use Observables.
  - To avoid duplicating work, we'll need to track what changed.
  - Editing an element is troublesome, because we currently don't have deep reactivity for objects, so probably ignore this for now.

1. Entire array must be an observable, which will tell us when elements are added, removed. That's already covered because the source data will already have been made using `state$`.
   - could probably handle repositioning as well using a combination of remove then add - and we might have to, because the index in the list won't be updated in the event handlers.
2. To figure out which elements of the array were added and removed, we have to basically diff them.
   - The parent element keeps track of which child elements it has currently in the DOM.
   - We then match every key in the new array to the keys we already have, based on their position.
     - If, given a position, the new array element and the current DOM element have the same key, then no work needs to be done.
     - However, given a position, if the keys at that position don't match, or the parent does not have the key at all, then the DOM at that position will need to be re-created and replaced (or add a new one) at that position.
     - During these operations, we will keep track of what keys are currently in use in the new array separately. After the new array has been iterated, any keys from the parent record that don't exist in this array will be removed from the record and the DOM.
   - PROBLEM: this method means that adding/removing elements in the middle of the array will have a cascading effect on the rest of the elements in the list. If adding/removing an element at the bottom, this is faster. If adding/removing an element at the top, it costs the same as re-rendering the entire list.

(consider making a map$ function in state.ts that creates a Map, which might actually make this algorithm easier. Maps will remember the order in which keys were inserted, so that's not an issue. We can probably just implement the above algorithm with maps instead.)
