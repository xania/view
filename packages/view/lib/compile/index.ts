import { reduce, templateBind } from '../tpl';
import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import { Program } from './program';
// import { Signal } from '../signals';
import { ApplyStateHandler, HydrateOperationType } from './hydrate-operation';
import { isAttachable, isViewable } from '../render';
import { scopeProp } from '../reactive';

export function compile(
  children: JSX.Element
): JSX.MaybePromise<Program | null> {
  function binder(value: JSX.Value): JSX.MaybePromise<Program | null> {
    if (value instanceof Program) {
      return value;
    } else if (isDomDescriptor(value)) {
      switch (value.type) {
        case DomDescriptorType.Element:
          const children = templateBind(value.children, binder);
          const mergedView = children ? reduce(children, Program.merge) : null;
          if (mergedView instanceof Promise) {
            return mergedView.then((resolved) =>
              Program.fromElement(value, resolved)
            );
          }
          return Program.fromElement(value, mergedView);
        default:
          return new Program([value]);
      }
    } else if (isViewable(value)) {
      const view = templateBind(value.view(), binder);
      return reduce(view, Program.merge);
    } else if (isAttachable(value)) {
      throw Error('not (yet) supported');
    } else if (typeof value === 'string') {
      return new Program([
        {
          type: DomDescriptorType.Text,
          text: value,
        },
      ]);
    } else if (typeof value === 'number') {
      return new Program([
        {
          type: DomDescriptorType.Text,
          text: String(value),
        },
      ]);
    } else {
      const key = Math.random();
      Object.defineProperty(value, scopeProp, { value: key });

      return new Program(
        [
          {
            type: DomDescriptorType.Text,
            text: value.initial === undefined ? '' : String(value.initial),
          },
        ],
        {
          [key]: [
            {
              type: HydrateOperationType.ApplyStateHandler,
              state: value,
            } as ApplyStateHandler,
          ],
        }
      );
    }
  }

  const maybePromise = templateBind(children, binder);
  return reduce(maybePromise, Program.merge);
}

export * from './program';
export * from './hydrate-operation';
export * from './execute';
