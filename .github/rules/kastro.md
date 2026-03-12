---
description: Our web framework kastro
alwaysApply: false
---
kastro is our web framework. The idea is to do as much work as possible at
compile time, while having superb developer experience. In kastro, components
are rendered at compile time, and only the code which can manipulate the
existing DOM structures is shipped to the client. It is so optimized, most
component code shipped to the client won't know how to re-create these DOM
structures if they were deleted.

kastro is built on kdjs; it provides custom css and jsx transpilers to kdjs,
which in turn crawls the files and applies necessary transpilers and compiles
the resulting files.

In kastro, each component is written in a .jsx file. The same jsx file is
evaluated at compile time to generate the HTML of the component tree (which
browsers can very quickly convert to a DOM structure) and also compiled to a
client js using kdjs via the custom jsx->js transpiler kastro provides.
