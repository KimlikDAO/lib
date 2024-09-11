# `kastro`: KimlikDAO UI framework

`kastro` is a UI framework for building hyper efficient web apps by pushing as
much work as possible to compile time, obtaining highly optimized and tailor
made html, js and css's for each page.

In `kastro`, components are resolved and rendered at compile time, allowing
us to precompress the resulting html to a maximum, and even cache the results
on the edge preemptively.

In `kastro`, each component has its own directory, containing at least a `jsx`
file responsible for rendering the component, and a `js` file managing the DOM
interactions. Here, `jsx` files are used only during compilation and the JavaScript
code that is sent to the client is obtained by compiling the `js` files with our
advanced JavaScript compiler, `kdjs`.

Our in-house JavaScript compiler, `kdjs`, expects your code to be annotated with
[Google Closure type annotations](https://github.com/google/closure-compiler/wiki/Types-in-the-Closure-Type-System)
and uses this type information to perform aggressive optimizations which are not
possible otherwise. `kdjs` internally uses the Google Closure Compiler, but it
has many additional optimization passes and a full support for es6 modules.
