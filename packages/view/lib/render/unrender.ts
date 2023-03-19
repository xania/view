import { Template, templateBind } from '../tpl';
import { View } from '../compile';
import { Disposable, isDisposable } from '../disposable';

export function unrender(result: Template<Removable | View | Disposable>) {
  templateBind(result, (value) => {
    console.log('unrender', value);
    if (value instanceof Disposable) {
      value.dispose();
    } else if (value instanceof View) {
      if (value.dispose) value.dispose();
    } else if (value && value.remove instanceof Function) {
      (value as ChildNode).remove();
    } else if (value instanceof Function) {
      // clean up function
      value();
    } else if (isDisposable(value)) {
      value.dispose();
    }
  });
}

interface Removable {
  remove(): any;
}
