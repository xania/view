const __refs: unknown[] = [];
export async function hydrate<T>(state: T): Promise<T> {
  const result = { root: undefined };

  const stack: [any, number | string, unknown][] = [[result, 'root', state]];

  while (stack.length) {
    const [target, key, input] = stack.pop()!;
    let output: any;
    if (input === null || input === undefined) {
      target[key] = output = input;
    } else if (isRef(input)) {
      target[key] = output = __refs[input.__ref - 1];
    } else if (input instanceof Array) {
      target[key] = output = [];
      for (let i = input.length - 1; i >= 0; i--) {
        stack.push([output, i, input[i]]);
      }
    } else if (isClosureDescriptor(input)) {
      target[key] = output = createLazyClosure(input);
    } else if (isCtorDescriptor(input)) {
      const { __ctor, ...instance } = input;
      for (const prop in instance) {
        stack.push([instance, prop, (instance as any)[prop]]);
      }

      const module = await input.__ctor.__ldr();
      const closure = module[input.__ctor.__name];
      const Ctor = closure();
      target[key] = output = {};
      Reflect.setPrototypeOf(output, Ctor.prototype);
      for (const prop in instance) {
        stack.push([output, prop, (instance as any)[prop]]);
      }
    } else if (typeof input === 'object') {
      target[key] = output = {};
      for (const prop in input) {
        stack.push([output, prop, (input as any)[prop]]);
      }
    } else {
      target[key] = output = input;
    }
    __refs.push(output);
  }

  return result.root as T;
}

interface ClosureDescriptor {
  __ldr: Function;
  __name: string;
  __args: any[];
}
function isClosureDescriptor(value: any): value is ClosureDescriptor {
  if (value === null || value === undefined || typeof value !== 'object')
    return false;
  return '__ldr' in value && '__name' in value;
}

function isCtorDescriptor(value: any): value is { __ctor: ClosureDescriptor } {
  if (value === null || value === undefined || typeof value !== 'object')
    return false;
  return '__ctor' in value;
}

function createLazyClosure({ __ldr, __name, __args }: ClosureDescriptor) {
  return async function lazyClosure(this: any, ...args: any[]) {
    const module = await __ldr();
    const closure = module[__name];

    if (__args) {
      return hydrate(__args).then((deps) => {
        const func = closure(...deps);
        return func.apply(this, args);
      });
    } else {
      const func = closure();
      return func.apply(this, args);
    }
  };
}

interface RefDescriptor {
  __ref: number;
}

function isRef(value: any): value is RefDescriptor {
  if (value === null || value === undefined || typeof value !== 'object')
    return false;
  return '__ref' in value;
}
