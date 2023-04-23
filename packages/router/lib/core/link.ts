export interface LinkProps {
  to: string;
  active?: string;
}

export function Link(props: LinkProps) {
  return `error link [${props.to}]`;
}
