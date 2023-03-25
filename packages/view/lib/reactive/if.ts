import { State } from './state';

export interface IfProps {
  condition: boolean | JSX.Stateful<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
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
