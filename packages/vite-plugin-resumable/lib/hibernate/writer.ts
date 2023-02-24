import { ref, cl, proto } from '../hydrate';
import { ImportMap, Literal, primitives, RefMap, valueTypes } from './utils';

interface StringWriter {
  write(s: string): void;
}
export class HibernationWriter {
  public refMap = new RefMap();
  public importMap = new ImportMap();

  constructor(public root: string, public output: StringWriter) {}
  async write(value: any) {
    const stack: any[] = [value];
    while (stack.length) {
      const curr = stack.pop()!;
      if (curr === null || curr === undefined) {
        // ignore
      } else if (curr instanceof Array) {
        for (let i = curr.length - 1; i >= 0; i--) {
          stack.push(curr[i]);
        }
      } else if (curr instanceof Promise) {
        stack.push(await curr);
      } else if (curr instanceof Function) {
        this.writeScript(curr);
      } else if (typeof curr === 'string') {
        this.output.write(curr);
      }
    }
  }
  writeScript(curr: any) {
    const { __src, __name, __args } = curr as any;
    if (__src && __name) {
      const { output, root } = this;
      const deps = __args instanceof Function ? __args() : [];
      // const scriptDeps = resolveDependencies(deps);
      output.write(`
      <script type="module">
      import {hydrate, start, proto, cl, ref} from "/@resumable/hydrate";\n`);

      // if (scriptDeps) {
      //   scriptDeps.add(__name, __src);
      //   for (const [source, desc] of scriptDeps.entries) {
      //     const url = source.slice(root.length + 1).replace('\\', '/');
      //     output.write(
      //       `import { ${desc.names.join(
      //         ', '
      //       )} } from "/@client[${desc.names.join(',')}]/${url}";\n`
      //     );
      //   }
      // }
      output.write('const cache = [];\n');
      const entry = this.importMap.add(__name, __src);

      output.write(`start(${entry}("${__name}"), `);
      this.writeObjects(deps);
      output.write(`);\n`);

      for (const [source, desc] of this.importMap.entries) {
        const url = source.slice(root.length + 1).replace('\\', '/');
        output.write(
          `\nfunction ${
            desc.id
          }(n) { return () => import("/@client[${desc.names.join(
            ','
          )}]/${url}").then(mod => mod[n]); }`
        );
      }

      output.write(`
      </script>`);
    } else {
      console.log(`Function is not resumable`);
    }
  }

  refCount: number = -1;

  writeObjects(objs: any) {
    const { output, refMap } = this;

    traverse(objs, output, (value) => {
      if (valueTypes.includes(typeof value)) {
        this.refCount++;
        return value;
      }

      if (refMap.hasRef(value)) {
        const i = refMap.getRef(value)!;
        return { [`[${ref.description}]`]: lit(i.toString()) };
      }

      refMap.addRef(value, ++this.refCount);

      if (hasFunctionMeta(value)) {
        const ldr = this.importMap.add(value.__name, value.__src);
        if (value.__args instanceof Function) {
          const deps = value.__args();
          return {
            deps,
            [`[${cl.description}]`]: lit(`${ldr}("${value.__name}")`),
          };
        } else {
          return {
            [`[${cl.description}]`]: lit(`${ldr}("${value.__name}")`),
          };
        }
      } else if (hasInstanceMeta(value)) {
        // refMap.addRef(value, ++this.refCount);

        return { ...value, [`[${proto.description}]`]: value.constructor };
      }
    });
  }

  importDesc(value: any) {
    const { importMap } = this;
    const { __src, __name, __args } = value as {
      __src: string;
      __name: string;
      __args?: () => any[];
    };

    if (!__src || !__name) {
      console.error('value has no import description', value);
      return null;
    }

    // const __ldr = importMap.add(`/closures/${__name}.js`);

    const __ldr = importMap.add(__name, __src);

    if (!__src || !__name) {
      console.error('import descriptor of value is missing', value.toString());
      throw Error('import descriptor of value is missing');
    }

    return {
      __ldr: new Literal(__ldr),
      __name,
      __args: __args instanceof Function ? __args() : null,
    };
  }
}

function traverse(objs: any, writer: StringWriter, f: (value: any) => any) {
  const stack = [objs];

  while (stack.length) {
    const curr = stack.pop()!;

    if (curr instanceof Literal) {
      writer.write(curr.value);
      continue;
    }

    const output = f(curr) ?? curr;

    if (output === null) {
      writer.write('null');
    } else if (output === undefined) {
      writer.write('undefined');
    } else if (output instanceof Array) {
      writer.write('[');
      stack.push(RBRACKET);
      for (let i = output.length - 1; i >= 0; i--) {
        stack.push(output[i]);
        if (i > 0) stack.push(COMMA);
      }
    } else if (output instanceof Function) {
      writer.write("() => throw Error('non hibernatable function')");
    } else if (typeof output === 'string') {
      writer.write(`"${output}"`);
    } else if (primitives.includes(typeof output)) {
      writer.write(output.toString());
    } else if (typeof output === 'object') {
      writer.write('{');
      stack.push(RCURLY);

      const keys = Object.keys(output);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        stack.push(output[key], COLON, lit(key));
        if (i > 0) stack.push(COMMA);
      }
    }
  }
}

interface FunctionMeta {
  __src: string;
  __name: string;
  __args: () => any;
}

export function hasFunctionMeta(value: any): value is FunctionMeta {
  if (!value) return false;

  const { __src, __name } = value;
  return __src && __name;
}

export function hasInstanceMeta(
  value: any
): value is { constructor: FunctionMeta } {
  if (!value || !value.constructor || value.constructor === Object)
    return false;

  return hasFunctionMeta(value.constructor);
}

// class FunctionDescriptor {
//   constructor(public src: string, public name: string, public deps: any[]) {}

//   static fromFunc(func: Function) {
//     const { __src, __name, __args } = func as any;
//     if (__src && __name) {
//       const deps = __args instanceof Function ? __args() : null;
//       return new FunctionDescriptor(__src, __name, deps);
//     }

//     return null;
//   }
// }

// class InstanceDescriptor {
//   constructor(public values: any, public ctor: FunctionDescriptor) {}
// }

function lit(value: string) {
  return new Literal(value);
}

const RCURLY = lit('}');
const RBRACKET = lit(']');
const COMMA = lit(',');
const COLON = lit(':');
