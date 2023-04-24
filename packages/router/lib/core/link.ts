export interface LinkProps {
  to: string;
  class?: string;
}

export function Link(props: LinkProps) {
  return `error link [${props.to}]`;
}
