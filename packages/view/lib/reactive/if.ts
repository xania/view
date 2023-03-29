import { State } from './state';

export interface IfProps {
  condition: JSX.MaybePromise<boolean | JSX.Stateful<boolean>>;
  children: JSX.Children;
}

export function If(props: IfProps): JSX.Children {
  if (props.condition instanceof Promise) {
    return props.condition.then((resolved) =>
      If({ ...props, condition: resolved })
    );
  }
  if (props.condition instanceof State) {
    return new IfExpression(props.condition, props.children);
  } else if (props.condition) {
    return props.children;
  } else {
    return null;
  }
}

export class IfExpression {
  constructor(
    public condition: JSX.Stateful<boolean>,
    public content: JSX.Children
  ) {}
}
