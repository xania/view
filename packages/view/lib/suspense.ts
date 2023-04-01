import { templateBind } from './tpl';
import { DomDescriptorType, isDomDescriptor } from './intrinsic/descriptors';
import { State } from './reactive';

type SuspenseReturnType = JSX.MaybePromise<JSX.Value[]>;

export function suspense(children: JSX.Children): SuspenseReturnType {
  return templateBind(children, (value) => {
    if (value instanceof State) {
      if (value.initial instanceof Promise) {
        return value.initial.then(() => value);
      }
    } else if (isDomDescriptor(value)) {
      if (value.type === DomDescriptorType.Element && value.children) {
        const suspended = suspense(value.children);
        if (suspended instanceof Promise) {
          return suspended.then((resolved) => ({
            ...value,
            children: resolved,
          }));
        } else {
          return { ...value, children: suspended };
        }
      }
    }
    return value;
  }) as SuspenseReturnType;
}
