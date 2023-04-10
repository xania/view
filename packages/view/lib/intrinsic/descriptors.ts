export enum DomDescriptorType {
  Element = 8585231 /* keep as first */,
  Data,
  StaticElement,
  Attribute,
  Text /* keep as last */,
}

export type DomDescriptor =
  | StaticElementDescriptor
  | ElementDescriptor
  | TextDescriptor
  | DataDescriptor
  | AttrDescriptor;

export type ElementDescriptor = {
  type: DomDescriptorType.Element;
  children?: JSX.Element;
  attrs?: { [name: string]: any };
  name: string;
};

export interface StaticElementDescriptor {
  type: DomDescriptorType.StaticElement;
  name: string;
  attrs?: ElementDescriptor['attrs'];
  children?: JSX.MaybeArray<StaticTemplate>;
}

export interface AttrDescriptor {
  type: DomDescriptorType.Attribute;
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
