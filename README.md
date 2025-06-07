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
  - [x] make it actually fucking work
  - [x] clean up the code
  - [x] allow providing a property string to use as the key instead of returning the key in an object. use lodash's get()
  - [ ] figure out what to do about the array index - if the values returned for each loop iteration use the index, it doesn't change when the array changes (it's not reactive, so it will be out of date if the element moves positions)
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
