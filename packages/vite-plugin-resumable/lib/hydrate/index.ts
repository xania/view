export const ref = Symbol('ref');
export const cl = Symbol('cl');
export const proto: unique symbol = Symbol('proto');

export async function hydrate<T>(cache: unknown[], state: T): Promise<T> {
  const result = { root: undefined };

  type StackItem = [any, number | string, unknown] | SetPrototype;
  const stack: StackItem[] = [[result, 'root', state]];

  while (stack.length) {
    const curr = stack.pop()!;

    if (curr instanceof SetPrototype) {
      await curr.apply();
      continue;
    }

    const [target, key, input] = curr;
    let output: any;

    if (input === null || input === undefined) {
      output = input;
    } else if (isRef(input)) {
      target[key] = output = cache[input[ref]];
      continue;
    } else if (input instanceof Array) {
      output = [];
      for (let i = input.length - 1; i >= 0; i--) {
        stack.push([output, i, input[i]]);
      }
    } else if (isClosureDescriptor(input)) {
      if (input.deps) {
        const deps: any[] = [];
        for (let i = input.deps.length - 1; i >= 0; i--) {
          stack.push([deps, i, input.deps[i]]);
        }
        output = createLazyClosure(input[cl], deps);
      } else {
        output = createLazyClosure(input[cl], []);
      }
    }

    // else if (isCtorDescriptor(input)) {
    //   const closure = input[proto];

    //   console.log(instance, constructor);
    //   // const loader = await constructor[cl]();
    //   // // const closure = await loader();

    //   // const deps = await hydrate(cache, constructor.d);
    //   // const Ctor = loader(deps);

    //   // const instance: object = {};

    //   // const keys = Object.keys(input.d);
    //   // for (let i = keys.length - 1; i >= 0; i--) {
    //   //   const key = keys[i];
    //   //   stack.push([instance, key, (input.d as any)[key]]);
    //   // }
    //   // stack.push([instance, ctor, constructor]);

    //   // output = instance;
    //   continue;
    // }
    else if (typeof input === 'object') {
      output = {};

      if (proto in input) {
        const action = new SetPrototype(output);
        stack.push(action);
        stack.push([action, 'closure', (input as any)[proto]]);
      }

      const keys = Object.keys(input);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        stack.push([output, key, (input as any)[key]]);
      }
    } else {
      output = input;
    }

    target[key] = output;
    cache.push(output);
  }

  return result.root as T;
}

interface ClosureDescriptor {
  [cl]: Function;
  deps: any[];
}
function isClosureDescriptor(value: any): value is ClosureDescriptor {
  if (value === null || value === undefined || typeof value !== 'object')
    return false;
  return cl in value;
}

function createLazyClosure(loader: ClosureDescriptor[typeof cl], deps: any[]) {
  async function lazyClosure(this: any, ...args: any[]) {
    const closure = await loader();
    const handler = deps instanceof Array ? closure(...deps) : closure();
    return handler(...args);
  }
  lazyClosure.deps = deps;
  lazyClosure.loader = loader;
  return lazyClosure;
}

interface RefDescriptor {
  [ref]: number;
}

function isRef(value: any): value is RefDescriptor {
  if (value === null || value === undefined || typeof value !== 'object')
    return false;
  return ref in value;
}

class SetPrototype {
  public closure: any;
  constructor(public instance: any) {}
  apply = async () => {
    const { loader, deps } = this.closure;
    const closure = await loader();

    const Ctor = closure(...deps);
    const { instance } = this;
    Reflect.setPrototypeOf(instance, Ctor.prototype);
  };
}

export async function start(loader: Function, raw: unknown) {
  const cache: unknown[] = [];
  const closure = await loader();
  const deps: any = await hydrate(cache, raw);
  const func = closure(...deps);

  func();
}
