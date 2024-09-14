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

## Components

There are 3 types of components:

1. **Singleton**: Only one instance can be present in the page. These bind to
the DOM when you import them and can keep an arbitrary internal state (every
variable that you define in the module).
  ```javascript
  const State = [1, 2, 3];
  /** @kastroSingletonComponent */
  const SingletonComp = (props) => <div>Singleton</div>;
  export default SingletonComp;
  ```
  If your component is exposing additional methods, you can instead use
  ```javascript
  const State = [1, 2, 3];
  /** @kastroSingletonComponent */
  const SingletonComp = {
    render: (props) => <div>Singleton</div>,
    push: (x) => State.push(x),
    pop: () => State.pop(),
  }
  export default SingletonComp;
  ```

2. **Stateless**: These are components that do not have any internal state
  besides the DOM state. Since they are stateless, there can be arbitrary
  number of instances in the page without any js objects being created. Kastro
  compiler will generate the `bind()` invocations from the `render()` jsx
  expression of the parent component.
  ```javascript
  /** @kastroStatelessComponent */
  const StatelessComp =  {
    render: ({ id }) => <div id={id}>on</div>,
    bind: (id) => {
      const root = document.getElementById(id);
      root.onclick = () => root.innerText = root.innerText == "on" ? "off" : "on"
    }
  }
  export default StatelessComp;
  ```

3. **Stateful**: These are components that have internal state and for each instance
  of the component, a class instance is crated and exported.
  ```javascript
  /** @kastroStatefulComponent */
  class CheckBox {
    static render({ id }) { return <div id={id}>on</div>; }
    constructor(id) { this.root = document.getElementById(id); this.on = true; }
    flip() { this.on = !this.on; this.root.innerText = this.on ? "on" : "off"; }
  }
  export default CheckBox;
  ```
