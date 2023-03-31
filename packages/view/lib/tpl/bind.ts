export type BindFunction<T, U> = (
  x: NonNullable<T>,
  ...args: any[]
) => JSX.Template<U>;

export function templateBind<T, U>(
  rootChildren: JSX.Template<T>,
  binder: BindFunction<T, U>,
  ...args: any[]
): JSX.Template<U> {
  const output: JSX.MaybePromise<NonNullable<U>>[] = [];

  return traverse([rootChildren]);

  function traverse(stack: JSX.Template<T>[]): JSX.Template<U> {
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
        if (isIterable(curr)) {
          // console.log('async iter', curr);
          const arr: any[] = [];
          for (const x of curr) {
            if (x) arr.unshift(x);
          }
          stack.push(...arr);
        } else {
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

export function isIterable<T>(obj: any): obj is Iterable<T> {
  if (!obj) return false;
  return (
    obj.constructor !== String &&
    Symbol.iterator &&
    obj?.[Symbol.iterator] instanceof Function
  );
}

export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return (
    Symbol.asyncIterator && obj?.[Symbol.asyncIterator] instanceof Function
  );
}
