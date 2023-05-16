import { AnchorNode, ElementNode, NodeFactory } from '../factory';
import { Sandbox } from '../reactivity';

export interface Attachable {
  attachTo(
    conatiner: HTMLElement | AnchorNode<HTMLElement>,
    domFactory: NodeFactory<any, any>,
    sandbox: Sandbox
  ): JSX.Sequence<any>;
}

export function isAttachable(value: any): value is Attachable {
  return (
    value !== null &&
    value !== undefined &&
    value['attachTo'] instanceof Function
  );
}
