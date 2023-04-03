import { Stateful } from '../reactive';

export enum DomDescriptorType {
  Element = 8585231 /* keep as first */,
  Data,
  StaticElement,
  Text /* keep as last */,
}

export type DomDescriptor =
  | StaticElementDescriptor
  | ElementDescriptor
  | TextDescriptor
  | DataDescriptor;

export type ElementDescriptor = {
  type: DomDescriptorType.Element;
  classList?: (string | Stateful<string>)[];
  children?: JSX.Element;
  attrs?: AttrDescriptor[] | null;
  name: string;
  events?: Record<string, JSX.EventHandler>;
};

export interface StaticElementDescriptor {
  type: DomDescriptorType.StaticElement;
  name: string;
  attrs?: ElementDescriptor['attrs'];
  children?: JSX.MaybeArray<StaticTemplate>;
}

export interface AttrDescriptor {
  name: string;
  value: any;
}

export type TextDescriptor = {
  type: DomDescriptorType.Text;
  text: string;
};

export type DataDescriptor = {
  type: DomDescriptorType.Data;
  data: any;
};

export function isDomDescriptor(value: any): value is DomDescriptor {
  if (typeof value !== 'object' || value === null) return false;

  const type = value.type;
  return type >= DomDescriptorType.Element && type <= DomDescriptorType.Text;
}

export type StaticTemplate =
  | StaticElementDescriptor
  | TextDescriptor
  | DataDescriptor;
