import { Rx } from './rx';

export function connect(source: Rx.Stateful, target: Rx.Stateful) {
  if (source === target) return;
  if (target.left === source) return;
  if (target.left) {
    connect(source, target.left);
  } else if (source.right) {
    connect(source.right, target);
  } else {
    source.right = target;
    target.left = source;

    disconnect(target, source);
  }
  // const tmp = source.right;
  // if (tmp) {
  //   target.right = tmp;
  //   tmp.left = target;
  // }

  // for (let i = 1; i < deps.length; i++) {
  //   const dep = deps[i];
  //   let t: Rx.Stateful['left'] = target;
  //   if (!target.left) {

  //     const tmp = dep.right;
  //     dep.right = target;
  //     target.left = dep;
  //     if (tmp) {
  //       dep.right = tmp;
  //       tmp.left = target;
  //     }

  //   }
  //   while (t.left) {

  //     t = t.left;
  //   }
  //   // if (parent !== dep && !findPrev(parent, dep)) {
  //   //   parent.right = dep;
  //   //   parent = latest(dep);
  //   // }
  // }

  // if (parent.right) {
  // }
  // parent.right = target;
}

function disconnect(source: Rx.Stateful, target: Rx.Stateful) {
  if (!target.left) {
  } else if (target.left === source) {
    source.right = undefined;
    target.left = undefined;
  } else {
    disconnect(source, target.left);
  }
}

function findPrev(target: Rx.Stateful, dep: Rx.Stateful) {
  let curr: Rx.Stateful | undefined = target.left;
  while (curr) {
    if (curr === dep) return true;

    // walk back
    curr = curr.left;
  }
  return false;
}

export function pushNode(
  source: Rx.Stateful,
  target: Rx.Stateful,
  checkCircular: boolean = true
): boolean {
  if (checkCircular) {
    if (
      find(target, (n) => n === source) ||
      find(source, (n) => n === target)
    ) {
      // circular
      return false;
    }
  }

  const parent = latest(source);
  parent.right = target;
  target.left = parent;

  return true;
}

export function removeNode(state: Rx.Stateful): boolean {
  if (state.left) {
    state.left = state.right;
    return true;
  }

  return false;
}

// function pushRoot(computed: Rx.Computed, root: Rx.Root) {
//   if (computed.roots instanceof Array) {
//     if (!computed.roots.includes(root)) computed.roots.push(root);
//   } else computed.roots = [root];
// }

// function removeRoot(computed: Rx.Computed, root: Rx.Root) {
//   if (computed.roots instanceof Array) {
//     const idx = computed.roots.indexOf(root);
//     if (idx >= 0) {
//       computed.roots.splice(idx, 1);
//     }
//   }
// }

function find(node: Rx.Stateful, predicate: (node: Rx.Stateful) => boolean) {
  while (!predicate(node)) {
    if (!node.right) {
      return false;
    }
    node = node.right;
  }
  return node;
}

function latest(node: Rx.Stateful) {
  while (node.right) {
    node = node.right;
  }
  return node;
}

export function findRight(node: Rx.Stateful, needle: Rx.Stateful) {
  while (node.right) {
    if (node.right === needle) return true;
    node = node.right;
  }
  return false;
}

export function findLeft(node: Rx.Stateful, needle: Rx.Stateful) {
  while (node.left) {
    if (node.left === needle) return true;
    node = node.left;
  }
  return false;
}
