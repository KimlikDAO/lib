# `kastro`: KimlikDAO UI framework

`kastro` is a UI framework for building pico-optimized web applications by
moving as much computation to compile time as possible. It achieves extreme
performance while maintaining a familiar React-like developer experience.

Key features:
 - ✅ Components written in `jsx`, just like React
 - ⚡️ Static rendering at build time for optimal performance
 - 🗜️ Minimal client-side JavaScript bundle
 - 🔍 Advanced compile-time optimizations and type safety through our javascript
   compiler `kdjs`
 - 🌐 End to end integrated i18n, asset bundling and css modules

Unlike other frameworks that offer static rendering, kastro takes a radical
approach to optimization: the client JavaScript bundle contains only the code
needed to manipulate existing DOM elements. All component structure and
rendering logic is optimized away at compile time.

This means the client bundle is extremely lightweight - it doesn't contain any
code for rendering components or managing a virtual DOM. Everything that needs
to be in DOM is placed into an HTML file at compile time, which then can be
precompressed and pushed to the edge. Not only does this make the initial
download faster, but browsers are also highly optimized for constructing the
DOM directly from HTML, compared to constructing DOM elements one by one
using JavaScript like most other frameworks do.

## Example
```jsx filename="LandingPage.jsx"
import dom from "@kimlikdao/util/dom";
import { LangCode } from "@kimlikdao/util/i18n";
import ArrowSvg from "./arrow.svg";
import Css from "./LandingPage.css";

/**
 * @param {{ Lang: LangCode }} Lang
 */
const LandingPage = ({ Lang }) => {
  /** @const {!HTMLButtonElement} */
  const Button = dom.button(Css.ButtonId);
  /** @const {!HTMLSpanElement} */
  const Text = dom.span(Css.TextId);

  return (
    <html lang={Lang}>
      <Css />
      <Button onClick={() => Text.innerText = "Clicked!"}>
        <ArrowSvg />Click here!
      </Button>
      <Text>Hello World!</Text>
    </html>
  );
};

export default LandingPage;
```
When you import a .css file, you get a StyleSheet component like the `Css`
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
a minified version of the following
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
  <button id="A"><svg src="vlGA9oOP.svg"/>Click here!</button>
  <span id="B">Hello World!</span>
</html>
```
In particular, there is no runtime, no framework setup code or boilerplate.

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
When building for the client, the function part is stripped to essentially
a no-op and in particular, the entire jsx expression is removed.

There are 2 types of components, stateless and stateful. In stateless components
the function part binds the component to the dom; in stateful components, the
function part is used as a constructor of the component's instance.

### **Stateless**:
A component that does not take an `instance` property is deemed stateless.
Their dom id is fixed at compile time either by an `id` property passed by
their parent component, or by hardcoding it if the component appears at
most once in a page (thus assigning a unique id by the parent is unnecessary).

These components can keep an internal state, however if there are multiple
copies of the component in a page, they will share this state. This means
that for singleton components, we can freely keep internal state, however
for reusable components, either the entire state must be kept in the DOM
or passed into the methods of the component by the caller.

Kastro compiler will generate the `Component({ id: "idAssignedByParent" })`
invocations from the initialization code of the parent component.

```jsx
/** @param {{ id: string }} props */
const StatelessComp = ({ id }) => {
  /** @type {!HTMLDivElement} */
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
/** @param {{ id: string }} props */
const StatelessComp = ({ id }) => {
  /** @type {!HTMLDivElement} */
  const Root = dom.div(id);
  Root.onclick = () => Root.innerText = Root.innerText == "On" ? "Off" : "On";
  return null;
}
const Page = () => {
  StatelessComp({ id: "A" }); // Initialize the stateless component with id "A"
  return null;
}
Page();
```

### **Stateful**:
A component which takes an `instance` property is deemed stateful. These
components can keep an internal state and for each copy of the component, a
class instance is created.

Note the `instance` property is used by the client jsx transpiler and never
passed to the component itself.

```jsx
/** @param {{ id: string }} props */
const CheckBox = ({ id }) => {
  /** @type {!HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {boolean} */
  this.on = true;
  return <div id={id}>on</div>;
}
CheckBox.prototype.flip = function() {
  this.on = !this.on;
  this.root.innerText = this.on ? "on" : "off";
}

const PageWithCheckBox = () => (
  <html>
    <CheckBox id="A" instance={PageWithCheckBox.checkBox}/>
  </html>
);

PageWithCheckBox.isChecked = () => PageWithCheckBox.checkBox.on;
```
When the above jsx file is transpiled for the client by kastro (but before compilation by kdjs),
it will become
```javascript
/** @param {{ id: string }} props */
const CheckBox = ({ id }) => {
  /** @type {!HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {boolean} */
  this.on = true;
  return null;
}
CheckBox.prototype.flip = function() {
  this.on = !this.on;
  this.root.innerText = this.on ? "on" : "off";
}

const PageWithCheckBox = () => {
  PageWithCheckBox.checkBox = new CheckBox({ id: "A" });
  return null;
}
PageWithCheckBox();

PageWithCheckBox.isChecked = () => PageWithCheckBox.checkBox.on;
```
