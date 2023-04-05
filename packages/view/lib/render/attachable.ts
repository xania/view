import { DomFactory } from './dom-factory';
import { RenderTarget } from './target';

export interface Attachable {
  attachTo(conatiner: RenderTarget, domFactory: DomFactory): JSX.Sequence<any>;
}

export function isAttachable(value: any): value is Attachable {
  return (
    value !== null &&
    value !== undefined &&
    value['attachTo'] instanceof Function
  );
}
