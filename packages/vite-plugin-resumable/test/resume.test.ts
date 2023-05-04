import { sum } from "./module";

test('hibernate objects', () => {

  console.log('hello world')
  expect(sum(1, 2)).toBe(3);

});
