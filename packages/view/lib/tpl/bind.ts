import type { Sequence, Template } from './template';

export type BindFunction<T, U> = (
  x: NonNullable<T>,
  ...args: any[]
) => Sequence<U>;

export function templateBind<T, U>(
  rootChildren: Template<T>,
  binder: BindFunction<T, U>,
  ...args: any[]
): Sequence<U> {
  const output: JSX.MaybePromise<NonNullable<U>>[] = [];

  return traverse([rootChildren]);

  function traverse(stack: Template<T>[]): Sequence<U> {
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
            templateAppend(output, resolved);
            return traverse(stack);
          });
        }
        templateAppend(output, funResult);
      }
    }

    return output;
  }
}

export function templateAppend<U>(output: U[], additions: JSX.MaybeArray<U>) {
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
