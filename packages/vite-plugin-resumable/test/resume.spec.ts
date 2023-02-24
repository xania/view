'strict';

import { describe, expect, it } from 'vitest';
import { hasFunctionMeta, HibernationWriter } from '../lib/hibernate/writer';

describe('hibernate objects', () => {
  function hibernate(values: any) {
    let result = '';
    var w = new HibernationWriter('/', {
      write(s) {
        result += s;
      },
    });
    w.writeObjects(values);

    return {
      result,
      refMap: w.refMap,
      importMap: w.importMap,
    };
  }

  function closure() {}
  closure.__src = 'index.ts';
  closure.__name = 'closure';
  closure.__args = () => [1];

  class Klass {
    /**
     *
     */
    constructor(public value: number) {}
    static __src = './index.ts';
    static __name = 'Klass';
  }

  it('basic', () => {
    const values = [{ a: 1, b: 2 }, {}];
    const { result, refMap } = hibernate(values);
    expect(result).toBe('[{a:1,b:2},{}]');
    expect(refMap.getRef(values)).toBe(0);
    expect(refMap.getRef(values[0])).toBe(1);
  });

  it('value types', () => {
    const a = 'a';
    const i = 1;
    const values = [i, i, a, a];
    const { result, refMap } = hibernate(values);
    expect(result).toBe('[1,1,"a","a"]');
    expect(refMap.map.size).toBe(1);
  });

  it('nested', () => {
    const values = [{ a: { c: 1 }, b: {} }];
    const { result, refMap } = hibernate(values);
    expect(result).toBe('[{a:{c:1},b:{}}]');
    expect(refMap.getRef(values[0].b)).toBe(4);
  });

  it('closure', () => {
    const o = {};
    const values = [closure, closure, o] as const;
    const { refMap, result } = hibernate(values);

    expect(result).toBe('[{deps:[1],[cl]:mjpquuygcc("closure")},{[ref]:1},{}]');
    expect(refMap.getRef(closure)).toBe(1);
    expect(refMap.getRef(o)).toBe(4);
  });

  it('closure plus', () => {
    const obj = {};
    const values = [closure, obj, {}, obj, { a: obj }] as const;
    const { refMap, result } = hibernate(values);

    expect(result).toBe(
      '[{deps:[1],[cl]:mjpquuygcc("closure")},{},{},{[ref]:4},{a:{[ref]:4}}]'
    );
    expect(refMap.getRef(closure)).toBe(1);
    expect(refMap.getRef(obj)).toBe(4);
    expect(refMap.getRef(values[2])).toBe(5);
    expect(refMap.getRef(values[3])).toBe(4);
    expect(refMap.getRef(values[4])).toBe(6);
    expect(refMap.getRef(values[4].a)).toBe(4);
  });

  it('instance', () => {
    const instance = new Klass(1);
    const { result, refMap } = hibernate([Foo, instance, Klass]);

    expect(result).toBe(
      '[{[cl]:uvmjpquuyg("Foo")},{value:1,[proto]:{[cl]:uvmjpquuyg("Klass")}},{[ref]:4}]'
    );
    expect(refMap.getRef(instance)).toBe(2);
    expect(refMap.getRef(Klass)).toBe(4);
  });
});

class Foo {
  static __src = './index.ts';
  static __name = 'Foo';
}
