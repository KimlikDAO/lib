# `kastro`: KimlikDAO UI framework

`kastro` is a UI framework for building pico-optimized web applications by
moving as much computation to compile time as possible. It achieves extreme
performance while maintaining a familiar React-like developer experience.

Key features:
- Components written in `jsx`, just like React
- Static rendering at build time for optimal performance
- Minimal client-side JavaScript bundle
- Advanced compile-time optimizations and type safety through our javascript
  compiler `kdjs`
- End to end integrated i18n, asset bundling and css modules.

While other frameworks offer static rendering, kastro takes the compile time
approach to the extreme: the client JavaScript bundle is strictly limited to
manipulation of existing DOM elements. The component structure and rendering
logic are completely optimized away at compile time.
This means if the DOM were to be manually deleted, the client bundle would
have no way to reconstruct it, as that information is intentionally stripped
out during compilation for maximum optimization.

## Example
```jsx
import dom from "@kimlikdao/util/dom";
import { LangCode } from "@kimlikdao/util/i18n";
import ArrowSvg from "./arrow.svg";
import Css from "./page.css";

/** @const {HTMLButtonElement} */
const Button = dom.button(Css.ButtonId);
/** @const {HTMLSpanElement} */
const Text = dom.span(Css.TextId);

/**
 * @param {{ Lang: LangCode }} Lang
 * @return {Promise<string>}
 */
const Page = ({ Lang }) => (
  <html lang={Lang}>
    <Css />
    <Button onClick={() => Text.innerText = "Clicked!"}>
      <ArrowSvg />Click me!
    </Button>
    <Text>Hello World!</Text>
  </html>
);

export default Page;
```
When you import a `.css` file, you get a StyleSheet component like the `Css`
component in the example above. Each selector in the css file becomes available
as a property on this component, with the selector name converted to PascalCase.
For example, `.blue-button` becomes `Css.BlueButton`. 

In release mode, these selector values are minified to short strings like "A",
"B", etc. using a global counter to ensure uniqueness across your application.
This minification helps reduce the size of your CSS while maintaining the same
functionality.

Similarly, when you import an image, you get an `Image` component. Under the hood,
this component optimizes the image, copies it to the bundle with a content hashed
name and the promise it returns resolves to something like `<img src="vlGA9oOP.svg">`
If instead we used the image as `<ArrowSvg inline />`, kastro would first
optimize the svg with svgo and then pass all dom id's in the svg through the
same global counter to ensure they are unique and minified. The promise returned
would resolve to something like `<svg><path id="C" d="M10 10L10 10" /><use href="url(#C)" /></svg>`.

When you compile the above example, the client javascript will be literally
a minified verion of the following
```javascript
const get = (a) => document.getElementById(a);
const c = get("B");
get("A").onclick = () => c.innerText = "Clicked!";
```
and the following html will be generated (after de-minification):
```html
<!DOCTYPE html>
<html lang="en">
  <head><link rel="stylesheet" href="khmW2F9I.css" /></head>
  <button id="A"><svg src="vlGA9oOP.svg"/>Click me!</button>
  <span id="B">Hello World!</span>
</html>
```
In particular, there is no runtime, no boilerplate or any other code that 
would better be handled at compile time.

## Not reactive
As you may have noticed in the example above, kastro is not a reactive
framework. Reactivity is a paradigm where you define your component's layout
using a template such as
```jsx
 <Text>{State.text}</Text>
 <Button onClick={() => State.text = "Clicked!"}>
```
and the template is live: whenever a `State` variable changes, the template
automatically updates. While this approach simplifies certain aspects of
development, it comes at a significant cost: the framework must reimplement
substantial parts of the browser's functionality in JavaScript rather than
leveraging the browser's native code, which is highly efficient and already
shipped and installed on client machines.

## Components

In kastro, components are function objects: the function part is used to render
the component html and the object part is used to manage the DOM interactions.
The function part never ships to the client, only the object part is compiled in
the client bundle.

There are 3 types of components:

1. **Singleton**: Only one instance can be present in the page. These bind to
the DOM when you import the es6 module and can keep an arbitrary internal state
(every variable you define in the module is available as a property of the
component object).

If you component does not take an `id` property, then it is determined as 
a singleton.

  ```jsx
  const State = [1, 2, 3];
  const SingletonComp = () => <div>Singleton</div>;
  export default SingletonComp;
  ```
  If your component is exposing additional methods, you can add them like so:
  ```jsx
  const State = [1, 2, 3];
  const SingletonComp = () => <div>Singleton</div>;
  SingletonComp.push = (x) => State.push(x);
  SingletonComp.pop = () => State.pop();

  export default SingletonComp;
  ```

2. **Stateless**: A component that does not take an `id` property is deemed a
  stateless component. Since they are stateless, there can be arbitrary
  number of instances in the page without any js objects being created. Kastro
  compiler will generate the `Component({ id: "idAssignedByparent" })` invocations
  from the initialization code of the parent component.

  ```jsx
  const StatelessComp = ({ id }) => {
    const Root = dom.div(id);
    return (
      <Root
        onClick={() => Root.innerText = Root.innerText == "On" ? "Off" : "On"}
        >On</Root>
    );
  }

  const Page = () => (
    <html>
      <StatelessComp id="A" />
    </html>
  );
  ```
  When transpiled by kastro (but before compilation by kdjs), the above jsx file will become
  ```javascript
  const StatelessComp = ({ id }) => {
    const Root = dom.div(id);
    Root.onclick = () => Root.innerText = Root.innerText == "On" ? "Off" : "On";
    return null;
  }
  const Page = () => {
    StatelessComp({ id: "A" });
    return null;
  }
  Page();
  ```

3. **Stateful**: A component which takes a `instanceId` property is deemed a
  stateful component. These components have internal state and for each instance
  of the component, a class instance is crated.

  ```jsx
  const CheckBox = ({ instanceId }) => {
    this.root = dom.div(instanceId);
    return <div id={instanceId}>on</div>;
  }
  CheckBox.prototype.flip = function() {
    this.on = !this.on;
    this.root.innerText = this.on ? "on" : "off";
  }
  
  const PageWithCheckBox = () => (
    <html>
      <CheckBox instanceId="A" />
    </html>
  );
  ```
  When the above jsx file is transpiled for the client by kastro (but before compilation by kdjs),
  it will become
  ```javascript
  const CheckBox = ({ instanceId }) => {
    this.root = dom.div(instanceId);
    return null;
  }
  CheckBox.prototype.flip = function() {
    this.on = !this.on;
    this.root.innerText = this.on ? "on" : "off";
  }
  
  const PageWithCheckBox = () => {
    new CheckBox({ instanceId: "A" });
    return null;
  }
  PageWithCheckBox();
  ```
