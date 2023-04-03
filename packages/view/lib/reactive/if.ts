import { State } from './state';

export interface IfProps {
  condition: JSX.MaybePromise<boolean | JSX.Stateful<boolean>>;
  children: JSX.Children;
}

export async function If(props: IfProps): Promise<JSX.Children> {
  if (props.condition instanceof Promise) {
    const condition = await props.condition;
    return If({ condition, children: props.children });
  } else if (props.condition instanceof State) {
    return new IfExpression(props.condition, props.children as JSX.Element);
  } else if (props.condition) {
    return props.children as JSX.Element;
  } else {
    return null;
  }
}

export class IfExpression {
  constructor(
    public condition: JSX.Stateful<boolean>,
    public content: JSX.Element
  ) {}
}
