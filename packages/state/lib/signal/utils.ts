﻿import { Rx } from '../rx';

export function nodeToString(
  this: Rx.Stateful & Rx.Graph,
  visited: Set<Rx.Stateful & Rx.Graph> = new Set()
) {
  if (visited.has(this)) {
    return `[CIRCULAR:${'label' in this ? this.label : `{${this.snapshot}}`}]`;
  }

  const operators = this.operators;

  if (!('label' in this)) {
    return `{${this.snapshot}}`;
  }

  visited.add(this);

  let retval = this.label + (this.dirty ? '*' : '');

  // if (operators?.length) {
  //   retval += ' [';
  //   for (let i = 0, len = operators.length || 0; i < len; i++) {
  //     if (i > 0) retval += ',';

  //     const target = operators![i].target;

  //     retval +=
  //       ' ' + ('label' in target ? target.label : `{${target.snapshot}}`);
  //   }
  //   retval += ' ]';
  // }

  if (this.right) {
    retval += ' --> ' + nodeToString.apply(this.right as any, [visited]);
  }

  return retval;
}
