import { Signal } from './signal';

interface IfProps {
  condition: Signal<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
  return new IfExpression(props);
}

export class IfExpression {
  constructor(public props: IfProps) {}
}
