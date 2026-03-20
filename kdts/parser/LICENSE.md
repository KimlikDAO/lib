MIT License

Copyright (c) 2022 Tyreal Hu
Copyright (c) 2025 The Svelte Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


# @sveltejs/acorn-typescript

[![License](https://img.shields.io/npm/l/svelte.svg)](LICENSE.md) [![Chat](https://img.shields.io/discord/457912077277855764?label=chat&logo=discord)](https://svelte.dev/chat)

This is a plugin for [Acorn](http://marijnhaverbeke.nl/acorn/) - a tiny, fast JavaScript parser, written completely in JavaScript.

It was created as an experimental alternative, faster [TypeScript](https://www.typescriptlang.org/) parser. It will help you to parse
TypeScript using Acorn.

## Usage

To get started, import the plugin and use Acorn's extension mechanism to register it. You have to enable `options.locations` while using `@sveltejs/acorn-typescript`.

```typescript
import { Parser } from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';

const node = Parser.extend(tsPlugin()).parse(
	`
const a = 1
type A = number
export {
  a,
  type A as B
}
`,
	{
		sourceType: 'module',
		ecmaVersion: 'latest',
		locations: true
	}
);
```

If you want to enable parsing within a TypeScript ambient context, where certain syntax have different rules (like `.d.ts` files and inside [declare module blocks](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)):

```typescript
import { Parser } from 'acorn';
import { tsPlugin } from '@sveltejs/acorn-typescript';

const node = Parser.extend(tsPlugin({ dts: true })).parse(
	`
const a = 1
type A = number
export {
  a,
  type A as B
}
`,
	{
		sourceType: 'module',
		ecmaVersion: 'latest',
		locations: true
	}
);
```

## SUPPORTED

- Typescript normal syntax
- Support to parse TypeScript [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- Support to parse JSX & TSX

## CHANGELOG

[click](./CHANGELOG.md)

## Acknowledgments

We want to thank [TyrealHu](https://github.com/TyrealHu) for his original work on this project. He maintained [`acorn-typescript`](https://github.com/TyrealHu/acorn-typescript) until early 2024.
