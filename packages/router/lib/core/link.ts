interface LinkProps {
  to?: string;
}

export function Link(props: LinkProps) {
  return `error link [${props.to}]`;
}
