export type ReactiveGraph = ReactiveNode[];

interface ReactiveNode {
  dependencies?: ReactiveNode[];
  parent?: ReactiveNode;
  initial?: any;
}

export function create() {
  const nodes: ReactiveGraph = [];
  return {
    nodes,
    push(node: ReactiveNode) {
      const stack = [node];
      const pending: ReactiveNode[] = [];

      while (stack.length) {
        const curr = stack.pop()!;

        if (!curr || nodes.includes(curr)) {
          continue;
        }

        pending.push(curr);

        const { dependencies, parent } = curr;
        if (dependencies instanceof Array) {
          for (const dep of dependencies) {
            if (dep) {
              stack.push(dep);
            }
          }
        } else if (parent) {
          stack.push(parent);
        }
      }

      while (pending.length) {
        const curr = pending.pop()!;
        if (!nodes.includes(curr)) {
          nodes.push(curr);
        }
      }
    },
  };
}
