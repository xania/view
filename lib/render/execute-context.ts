import { Disposable } from '../disposable';

export interface ExecuteContext extends Record<string | number | symbol, any> {
  bindings?: Disposable[];
  subscriptions?: JSX.Unsubscribable[];
  rootElement?: HTMLElement;
  moreRootElements?: HTMLElement[];
}
