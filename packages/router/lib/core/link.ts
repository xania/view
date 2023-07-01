import { Component } from 'xania';

export interface LinkProps {
  to?: string;
  class?: string;
}

export function Link(props: LinkProps) {
  return new Component(Link, props);
}
