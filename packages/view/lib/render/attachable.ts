﻿import { AnchorNode, ElementNode, NodeFactory } from '../factory';

export interface Attachable {
  attachTo(
    conatiner: ElementNode | AnchorNode,
    domFactory: NodeFactory
  ): JSX.Sequence<any>;
}

export function isAttachable(value: any): value is Attachable {
  return (
    value !== null &&
    value !== undefined &&
    value['attachTo'] instanceof Function
  );
}
