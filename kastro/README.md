# `kastro`: KimlikDAO UI framework

Kastro is a UI framwork for building hyper efficient web apps by pushing as
much work as possible to compile time, obtaining highly optimized and tailor
made html js and css'es for each page.

In Kastro, components are resolved and rendered at compile time, allowing
us to precompress the resulting html to a maximum, and even cache the results
on the edge preemptively.

In Kastro, each component has its own dirctory, containign at least a `jsx` 
file responsible for rendering the component, a `js` file managing the DOM
interactions.

Kastro comes with its own JavaScript compiler, `kdjs`, with advanced optimization
and minification capabilities.
