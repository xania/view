import { State } from './state';

export interface IfProps {
  condition: JSX.MaybePromise<boolean | JSX.State<boolean>>;
  children: JSX.Children;
}

export function If(props: IfProps): JSX.Element {
  if (props.condition instanceof Promise) {
    const condition = props.condition;
    if (condition instanceof Promise) {
      return condition.then((resolved) =>
        If({ condition: resolved, children: props.children })
      );
    }
    return If({ condition, children: props.children });
  } else if (props.condition) {
    return new IfExpression(props.condition, props.children as JSX.Element);
  } else {
    return null;
  }
}

export class IfExpression {
  constructor(
    public condition: boolean | JSX.State<boolean>,
    public content: JSX.Element
  ) {}
}
