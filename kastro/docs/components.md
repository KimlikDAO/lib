# Components in Kastro

There are two types of components in Kastro:

1. Stateless Components
2. Stateful Components 

There are also pseudo-components which behave somewhat like components in jsx expressions, which we will explain later.

## 1. Stateless Components

Components that don't take an `instance` property are called stateless components. Their DOM IDs are determined at compile time, either through an explicit `id` prop or obtained internally (either through Kastro automatic ID generators or hard-coded).

```jsx
/** @param {{ id: string }} props */
const Counter = ({ id }) => {
  const Root = dom.div(id);
  const Count = dom.span(`${id}.count`);
  
  return (
    <Root onClick={() => Count.innerText = "" + (+Count.innerText + 1)}>
      Count: <Count>0</Count>
    </Root>
  );
}

/**
 * Singletons can have methods to interact with the component.
 * @param {string} id
 */
Counter.reset = (id) => dom.span(`${id}.count`).innerText = "0";

// Usage:
const Page = () => (
  <html>
    <Counter id="counter1" />
    <Counter id="counter2" />
  </html>
);
```

When transpiled by Kastro (but before compilation by kdjs), this becomes:

```javascript
/** @param {{ id: string }} props */
const Counter = ({ id }) => {
  const Root = dom.div(id);
  const Count = dom.span(`${id}.count`);
  Root.onclick = () => Count.innerText = "" + (+Count.innerText + 1);
}

Counter.reset = (id) => dom.span(`${id}.count`).innerText = "0";

// Usage:
const Page = () => {
  Counter({ id: "counter1" });
  Counter({ id: "counter2" });
}
```

Stateless components can maintain internal state, but if multiple instances exist on a page, they will share that state. For singleton components (used once per page), internal state is fine--for such cases singleton components are the best choice. For reusable components, either:
- Keep all state in the DOM (approach taken in the example above)
- Pass state into component methods by the caller
- Consider using a stateful component instead

## 2. Stateful Components

Stateful components are function objects that take an `instance` property. For each instance of the component, a class instance is created and bound to the variable passed as the `instance` property.

```jsx
/**
 * @constructor
 * @param {{ id: string }} props
 */
const Counter = function({ id }) {
  /** @type {HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {number} */
  this.count = 0;
  
  return (
    <div id={id}>
      Count: <span>{this.count}</span>
    </div>
  );
}

Counter.prototype.increment = function() {
  this.root.lastElementChild.innerText = "" + ++this.count;
}

const Page = () => (
  <html>
    <Counter id="c1" instance={Page.counter1} />
    <Counter id="c2" instance={Page.counter2} />
  </html>
);

// Access instance methods
Page.counter1.increment();
```

When transpiled for the client:

```javascript
const Counter = function({ id }) {
  /** @type {HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {number} */
  this.count = 0;
}

Counter.prototype.increment = function() {
  this.root.lastElementChild.innerText = "" + ++this.count;
}

const Page = () => {
  Page.counter1 = new Counter({ id: "c1" });
  Page.counter2 = new Counter({ id: "c2" });
}
```

## Pseudo Components

Pseudo components bridge the gap between plain JSX elements and full components. They are created using `dom` utility methods and provide direct DOM access while supporting component-like features.

```jsx
/** @const {HTMLDivElement} */
const Root = dom.div(Css.Root);
/** @const {HTMLButtonElement} */
const Button = dom.button(Css.Button);

const Page = () => (
  <html>
    <Root onClick={() => console.log("clicked")}>
      <Button>Click me</Button>
      {/* Direct children can have event handlers */}
      <div onClick={() => console.log("inner div clicked")} />
    </Root>
  </html>
);
```

Key features of pseudo components:

1. Direct DOM access at runtime via `document.getElementById()`
2. Support for event handlers through JSX props
3. Support for special directives like `controlsDropdown={Dropdown}`
4. Event handlers on immediate children (but not deeper descendants)
5. Compile to efficient DOM lookups

At build time, `dom.()` methods return objects like `{ name: "div", id: "A" }`, while in client code they compile to `document.getElementById("A")` calls.

### Event Handler Scope

To encourage maintainable code, Kastro only allows event handlers on:
- The pseudo component itself
- Direct children of pseudo components

This limitation helps prevent deeply nested event handler chains that can be hard to track and maintain.

## Asset Components

Kastro provides specialized components for handling different types of assets:

```jsx
import MyImage from "./image.png";
import MyFont from "./font.ttf";
import MyWorker from "kastro:./worker.js"; // Import with kastro: prefix to get a worker

const Page = () => (
  <html>
    <MyImage width={100} height={100} />
    <MyFont />
    <MyWorker />
  </html>
);
```

See [Asset Handling](./assets.md) for detailed documentation on asset components.
