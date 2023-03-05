import { Rx } from './rx';

export function connect(source: Rx.Stateful, target: Rx.Stateful): boolean {
  if (source === target) return false;

  if (source.root === undefined || source.root === null) {
    source.root = source;
    source.gidx = 0;
  }

  if (source.root === target.root) {
    if (source.gidx! < target.gidx!) {
      return false;
    } else {
      let tmp = target.right;

      target.right!.left = target.left;
      if (target.left) {
        target.left.right = target.right;
      }
      target.left = source;
      target.right = source.right;

      if (source.right) {
        source.right.left = target;
      }

      source.right = target;

      // calibrate indexes
      let index = tmp!.gidx! - 1;
      while (tmp) {
        tmp.gidx = index++;
        tmp = tmp.right;
      }
      return true;
    }
  } else {
    target.root = source.root;
    let last = source;
    while (last.right) {
      last = last.right;
    }
    let first = target;
    while (first.left) {
      first = first.left;
    }
    last.right = first;
    first.left = last;

    // calibrate indexes
    let index = last.gidx! + 1;
    let tmp: Rx.Stateful | undefined = last.right;
    while (tmp) {
      tmp.gidx = index++;
      tmp.root = last.root;
      tmp = tmp.right;
    }

    return true;
  }
}
