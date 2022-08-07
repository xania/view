export default function flatten<T>(
  tree: ArrayLike<T>,
  childrenFn: (node: T) => ArrayLike<T> | undefined
) {
  const retval: T[] = [];
  if (!tree) return retval;
  type StackType = T | StackType[] | undefined;

  const stack: StackType[] = [];
  for (let i = 0; i < tree.length; i++) {
    stack[i] = tree[i];
  }
  while (stack.length > 0) {
    var curr = stack.pop() as StackType;
    if (curr instanceof Array) {
      let length = curr.length;
      while (length--) {
        stack.push(curr[length]);
      }
    } else if (curr !== null && curr !== undefined) {
      const children = childrenFn(curr);
      if (children)
        for (let i = children.length - 1; i >= 0; i--) {
          stack[stack.length] = children[i];
        }
      retval.push(curr);
    }
  }
  return retval;
}

export function bottomUp<T>(
  tree: ArrayLike<T>,
  childrenFn: (node: T) => ArrayLike<T> | undefined
) {
  const visited = new Set<T>();
  const retval: T[] = [];
  if (!tree) return retval;
  type StackType = T | StackType[] | undefined;

  const stack: StackType[] = [];
  for (let i = 0; i < tree.length; i++) {
    stack[i] = tree[i];
  }
  while (stack.length > 0) {
    var curr = stack.pop() as StackType;
    if (curr instanceof Array) {
      let length = curr.length;
      while (length--) {
        stack.push(curr[length]);
      }
    } else if (curr !== null && curr !== undefined) {
      if (visited.has(curr)) {
        visited.delete(curr);
        retval.push(curr);
      } else {
        const children = childrenFn(curr);
        if (children) {
          visited.add(curr);
          stack.push(curr);
          for (let i = children.length - 1; i >= 0; i--) {
            stack[stack.length] = children[i];
          }
        } else {
          retval.push(curr);
        }
      }
    }
  }
  return retval;
}
