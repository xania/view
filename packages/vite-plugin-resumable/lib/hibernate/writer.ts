import { fileToUrl } from '../utils';
import { ImportMap, Literal, primitives, RefMap } from './utils';

export class HibernationWriter {
  public refMap = new RefMap();
  public importMap = new ImportMap();

  constructor(public root: string, public output: { write(s: string): void }) {}
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
        const { __src, __name, __args } = curr as any;
        if (__src && __name) {
          const { output, root } = this;
          if (!__src.startsWith(root)) {
            continue;
          }
          const url = __src.slice(root.length + 1).replace('\\', '/');
          output.write(`
          <script type="module">
          import {hydrate} from "/@resumable/hydrate/index.js";
          import { "${__name}" as closure } from "/@client[${__name}]/${url}";
          `);
          if (typeof __args === 'function') {
            const closureArgs = __args();
            this.writeObject(closureArgs);
            output.write(`.then((args) => {
              const func = closure(...args);
              func();
            })
            `);
          } else {
            output.write(`
            const func = closure();
            func();
            `);
          }

          for (const [loader, source] of this.importMap.entries) {
            output.write(
              `\nfunction ${loader}(){ return import("${source}") }`
            );
          }

          output.write(`
          </script>`);
        } else {
          console.log(`Function is not resumable`);
        }
      } else if (typeof curr === 'string') {
        this.output.write(curr);
      }
    }
  }

  ref: number = 0;

  writeObject(obj: any) {
    const { output, refMap, importMap } = this;
    const stack = [obj];
    output.write('hydrate(');
    while (stack.length) {
      const curr = stack.pop()!;
      this.ref++;

      if (refMap.hasRef(curr)) {
        output.write(`{ __ref: ${refMap.getRef(curr)} }`);
        continue;
      }

      refMap.addRef(curr, this.ref);

      if (curr instanceof Literal) {
        output.write(curr.value);
      } else if (curr === null) {
        output.write('null');
      } else if (curr === undefined) {
        output.write('undefined');
      } else if (curr instanceof Date) {
        output.write(`new Date(${curr.getTime()})`);
      } else if (typeof curr === 'string') {
        output.write(`"${curr.replace(/"/g, '\\"')}"`);
      } else if (primitives.includes(typeof curr)) {
        output.write(curr.toString());
      } else if (typeof curr === 'symbol') {
        output.write(`Symbol("${curr.description}")`);
      } else if (curr instanceof Array) {
        output.write(`[`);
        stack.push(new Literal(']'));
        for (let i = curr.length - 1; i >= 0; i--) {
          stack.push(new Literal(','));
          stack.push(curr[i]);
        }
        // } else if (isSerializable(curr)) {
        //   const ref = refMap.addRef(curr);
        //   retval += `__refs[${ref}]=`;
        //   stack.push(curr.ssr());
        //   // } else if (curr instanceof Call) {
        //   //   const func = curr.func;
        //   //   retval += `mod.${func.name}(`;
        //   //   stack.push(new Literal(')'));
        //   //   for (let len = curr.args.length, i = len - 1; i >= 0; i--) {
        //   //     stack.push(new Literal(','));
        //   //     stack.push(curr.args[i]);
        //   //   }
      } else if (curr instanceof Function) {
        stack.push(this.importDesc(curr));
      } else if (curr.constructor !== Object) {
        output.write(`{`);
        stack.push(new Literal(`}`));
        stack.push(this.importDesc(curr.constructor));
        stack.push(new Literal(`__ctor:`));
        for (const k in curr) {
          const prop = curr[k];
          if (!(prop instanceof Function)) {
            stack.push(new Literal(','), prop, new Literal(`"${k}":`));
          }
        }
      } else {
        output.write(`{`);
        stack.push(new Literal('}'));
        for (const k in curr) {
          const prop = curr[k];
          if (prop !== undefined)
            stack.push(new Literal(','), prop, new Literal(`"${k}":`));
        }
      }
    }
    output.write(')');
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

    const __ldr = importMap.add(
      `/@client[${__name}]` + fileToUrl(__src, this.root)
    );

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
