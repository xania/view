import type { Template } from './template';

export type BindFunction<T, U> = (
  x: NonNullable<T>,
  ...args: any[]
) => Template<U>;

export function templateBind<T, U>(
  rootChildren: Template<T>,
  binder: BindFunction<T, U>,
  ...args: any[]
): Template<U> {
  const output: Template<U>[] = [];

  return traverse([rootChildren]);

  function flatAppend(additions: Template<U>) {
    if (additions === null || additions === undefined) {
      return;
    }
    if (additions instanceof Array) {
      const stack = [...additions];
      while (stack.length) {
        const curr = stack.pop();
        if (curr instanceof Array) {
          stack.push(...curr);
        } else if (curr !== null && curr !== undefined) {
          output.push(curr);
        }
      }
    } else {
      output.push(additions);
    }
  }

  function traverse(stack: Template<T>[]): Template<U> {
    while (stack.length) {
      const curr = stack.pop()!;

      if (curr instanceof Array) {
        for (let i = curr.length - 1; i >= 0; i--) {
          stack.push(curr[i]);
        }
      } else if (curr instanceof Promise) {
        // wait for completion of curr, then resume traverse
        return curr.then((resolved) => (stack.push(resolved), traverse(stack)));
      } else if (curr) {
        const funResult = binder.apply(null, [curr, ...args]);
        if (funResult instanceof Promise) {
          // wait for completion of result, then resume traverse
          return funResult.then((resolved) => {
            flatAppend(resolved);
            return traverse(stack);
          });
        }
        flatAppend(funResult);
      }
    }

    return output;
  }
}
