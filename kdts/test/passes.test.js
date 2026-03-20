import { expect, test } from 'bun:test';
import { removeStringNamedExports } from '../passes';

test('should remove quotes from export alias', () => {
  expect(removeStringNamedExports('export{u as"ü"};'))
    .toBe('export{u as ü};');
});

test('should handle multiple exports', () => {
  expect(removeStringNamedExports('export{a as"b", c as"d"};'))
    .toBe('export{a as b,c as d};');
});

test('should not modify correctly formatted exports', () => {
  expect(removeStringNamedExports('export{x as y};'))
    .toBe('export{x as y};');
});

test('should handle exports with spaces', () => {
  expect(removeStringNamedExports('export{  var1  as  "var2"  };'))
    .toBe('export{var1 as var2};');
});

test('should not affect other string literals', () => {
  expect(removeStringNamedExports('let str = "export{a as b}"; export{c as "d"};'))
    .toBe('let str = "export{a as b}"; export{c as d};');
});

test('should handle no space between as and alias', () => {
  expect(removeStringNamedExports('export{key as"value"};'))
    .toBe('export{key as value};');
});

test("", () => {
  expect(removeStringNamedExports('export{q as AdresButonu,te as"AğButonu",ne as"Menü",re as DebankLinki,ae as default};'))
    .toBe(`export{q as AdresButonu,te as AğButonu,ne as Menü,re as DebankLinki,ae as default};`);
});
