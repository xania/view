import { templateBind } from './tpl';
import { DomDescriptorType, isDomDescriptor } from './intrinsic/descriptors';

type SuspenseReturnType = JSX.MaybePromise<JSX.Value[]>;

export function suspense(children: JSX.Children): SuspenseReturnType {
  return templateBind(children, (value) => {
    if (isDomDescriptor(value)) {
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
