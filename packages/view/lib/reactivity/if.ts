import { State } from './state';

interface IfProps {
  condition: State<boolean>;
  children: JSX.Children;
}

export function If(props: IfProps) {
  return new IfExpression(props);
}

export class IfExpression {
  constructor(public props: IfProps) {}
}
