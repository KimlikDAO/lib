# Kastro: KimlikDAO UI framework

Kastro is a UI framework for building pico-optimized web applications by
moving as much computation to compile time as possible. It achieves extreme
performance while maintaining a familiar React-like developer experience.

Key features:
 - ✅ Components written in `jsx`, just like React
 - ⚡️ Static rendering at build time for optimal performance
 - 🗜️ Minimal client-side JavaScript bundle
 - 🔍 Advanced compile-time optimizations and type safety through our javascript
   compiler [`kdjs`](../kdjs/README.md)
 - 🌐 End to end integrated i18n, asset bundling and css modules

Unlike other frameworks that offer static rendering, Kastro takes a radical
approach to optimization: the client JavaScript bundle contains only the code
needed to manipulate existing DOM elements. All component structure and
rendering logic is optimized away at compile time.

This means the client bundle is extremely lightweight - it doesn't contain any
code for rendering components or managing a virtual DOM. Everything that needs
to be in the DOM is placed, at compile time, into an HTML file, which then can
be minified, pre-compressed and pushed to the edge. This approach not only
reduces initial download size and latency, but also speeds up page rendering -
browsers are highly optimized for constructing the DOM from static HTML,
compared to dynamically creating elements one by one via JavaScript like many
other frameworks do.

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
In Kastro, when you import a .css file, you get a StyleSheet component like
the `Css` component in the example above. Each selector in the css file becomes
available as a property on this component, with the selector name converted to
PascalCase. For example, `.blue-button` becomes `Css.BlueButton`. 

These properties map the selector name to a minified version, such as "A", "B",
obtained through a global counter. This reduces the bundle size while
maintaining the same functionality.

Similarly, when you import an image, you get an `Image` component. Under the hood,
this component optimizes the image, copies it to the bundle with a content hashed
name and the promise it returns resolves to something like `<img src="vlGA9oOP.svg">`
If instead we used the image as `<ArrowSvg inline />`, Kastro would first
optimize the svg with svgo and then pass all dom id's in the svg through the
same global counter to ensure they are unique and minified. The promise returned
would resolve to something like `<svg><path id="C"d="M10 10L10 10"/><use href="url(#C)"/></svg>`.

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
Unlike many modern frameworks, Kastro takes a deliberate stance against
reactivity. Reactive frameworks allow you to write templates like:
```jsx
<Text>{State.text}</Text>
<Button onClick={() => State.text = "Clicked!"}>
```
and the template automatically updates whenever a `State` variable changes.
While this reactive approach can simplify development, especially for certain
types of UI elements, it comes with significant costs. The framework needs to
reimplement core browser functionality in JavaScript - functionality that
browsers have already heavily optimized in native code. This duplication wastes
resources, increases app download times, and bypasses the browser's highly
efficient built-in capabilities that are already installed on every client
machine.

Instead, Kastro provides optimized headless components for implementing
many common ui patterns such as `<Switch>`. Component designers can use these
or create their own for the particular DOM interaction patterns they need.

A typical Kastro component code will be declarative, intuitive and boilerplate
free.

## Components

In Kastro, components are function objects: the function part is used to render
the component html and setup the DOM bindings while the object part is used to
manage the DOM interactions. When building for the client, the function part is
stripped to essentially a no-op and in particular, the entire jsx expression is
removed.

There are 2 types of components, stateless and stateful. In stateless components
the function part sets up the dom bindings; in stateful components, the function
part is used as a constructor of the component's instance.

### 1. Stateless
A component that does not take an `instance` property is deemed stateless.
Their dom id is fixed at compile time either by an `id` property passed by
their parent component, or by hardcoding it if the component appears at
most once in a page. Here, by "hardcoding" we mean that the id is determined
at compile time, but Kastro provides many ways to manage DOM ids 
automatically and efficiently; see StyleSheet Component section below.

These components can keep an internal state, however if there are multiple
copies of the component in a page, they will share the same state. This means
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
    <Root onClick={() => Root.innerText = Root.innerText == "On" ? "Off" : "On"}>
      On
    </Root>
  );
}

const Page = () => (
  <html>
    <StatelessComp id="A" />
  </html>
);
```
When transpiled by Kastro (but before compilation by kdjs), the above jsx file will become
```javascript
/** @param {{ id: string }} props */
const StatelessComp = ({ id }) => {
  /** @type {!HTMLDivElement} */
  const Root = dom.div(id);
  Root.onclick = () => Root.innerText = Root.innerText == "On" ? "Off" : "On";
}
const Page = () => {
  StatelessComp({ id: "A" }); // Initialize the stateless component with id "A"
}
Page(); // The root component is auto initialzied by Kastro transpiler
```

### 2. Stateful
A component which takes an `instance` property is deemed stateful. These
components can keep an internal state and for each copy of the component, a
class instance is created.

Note the `instance` property is used by the client jsx transpiler and never
passed to the component itself.

```jsx
/** @param {{ id: string }} props */
const CheckBox = function ({ id }) {
  /** @type {!HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {boolean} */
  this.on = true;
  return <div id={id}>on</div>;
}
CheckBox.prototype.flip = function () {
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
When the above jsx file is transpiled for the client by Kastro (but before compilation by kdjs),
it will become
```javascript
/** @param {{ id: string }} props */
const CheckBox = ({ id }) => {
  /** @type {!HTMLDivElement} */
  this.root = dom.div(id);
  /** @type {boolean} */
  this.on = true;
}
CheckBox.prototype.flip = function() {
  this.on = !this.on;
  this.root.innerText = this.on ? "on" : "off";
}

const PageWithCheckBox = () => {
  PageWithCheckBox.checkBox = new CheckBox({ id: "A" });
}
PageWithCheckBox();

PageWithCheckBox.isChecked = () => PageWithCheckBox.checkBox.on;
```
## Pseudo components

As mentioned above, Kastro components are function objects that start with a
capital letter.

Pseudo components are objects created using the `dom` utility methods, such
as `dom.div("domId")` or `dom.button("domId")`. They are typically given
capital letter names so they can be used directly in jsx.

One can attach event handlers to pseudo components through jsx onEvent
properties, or specify `controls[Role]={PseudoComponent}` directives such as 
`controlsDropdown={Dropdown}`.

```javascript
/** @enum {string} */
const Css = css` /** @export */ #Root {}`;
/** @const {!HTMLDivElement} */
const Root = dom.div(Css.Root);

const Page = () => (
  <html>
    <Root onClick={() => window.alert("clicked")} style="color: red;"/>
  </html>
);
```

At generation time, `dom.()` methods return objects like
`{ name: "div", id: "A" }`
whereas in client js code compile down to `document.getElementById("A")` calls.

Further, any direct children of a pseudo component can also be attached event
handlers like so:

```javascript
const Page = () => (
  <html>
    <Root style="color: red;">
      <div onClick={() => window.alert("clicked")}/>
      <hr onClick={() => window.alert("nice!")}/>
    </Root>
  </html>
);
```
Currently we do not allow attaching event handlers to grand children of
pseudo components to encourage more maintainable code.

## Kastro type system

Kastro leverages the type system of `kdjs` to provide both type safety and
powerful compile-time optimizations. Unlike TypeScript, where type information
is erased before optimization, Kastro's type system enables aggressive
optimizations that would not be possible without the type information being
available during compilation.

### Types

