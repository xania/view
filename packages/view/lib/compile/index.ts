import { reduce, templateBind } from '../tpl';
import { DomDescriptorType, isDomDescriptor } from '../intrinsic/descriptors';
import { Program, scopeProp } from './program';
// import { Signal } from '../signals';
import { ApplyStateHandler, HydrateOperationType } from './hydrate-operation';
import { isAttachable, isViewable } from '../render';
import { map } from '../reactive';
// import { initial } from '../reactive/initial';

export function compile(
  children: JSX.Element
): JSX.MaybePromise<Program | null> {
  function binder(
    value: JSX.Value
  ): JSX.MaybePromise<Program | null | undefined> {
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

      // value.initial

      return map(value.initial, (text) => {
        const program = new Program(
          [
            {
              type: DomDescriptorType.Text,
              text: text === undefined ? '' : String(text),
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

        program.graph.connect(value, {
          type: 'event',
        });

        return program;
      });
    }
  }

  const maybePromise = templateBind(children, binder);
  return reduce(maybePromise, Program.merge);
}

export * from './program';
export * from './hydrate-operation';
export * from './execute';

export function resolve<T, U>(
  x: JSX.MaybePromise<T | undefined>,
  mapper: (x: T | undefined) => U
): JSX.MaybePromise<U> {
  if (x instanceof Promise) {
    return x.then(mapper);
  }
  return mapper(x);
}
