export type TemplateNode =
  | TagTemplateNode
  | TextTemplateNode
  | AnchorTemplateNode;

export enum TemplateNodeType {
  Tag = 8585231,
  Text,
  Anchor,
}

export function isTemplateNode(value: any): value is TemplateNode {
  if (!value) return false;

  return (
    value.type === TemplateNodeType.Tag ||
    value.type === TemplateNodeType.Text ||
    value.type === TemplateNodeType.Anchor
  );
}

export function createTag(name: string): TagTemplateNode {
  return {
    type: TemplateNodeType.Tag,
    name,
    classList: [],
    childNodes: [],
    attrs: {},
  };
}
export interface TagTemplateNode {
  readonly type: TemplateNodeType.Tag;
  readonly classList: string[];
  readonly childNodes: TemplateNode[];
  readonly attrs: Record<string, any>;
  readonly name: string;
}

export function createText(data: string): TextTemplateNode {
  return {
    type: TemplateNodeType.Text,
    data,
  };
}
export interface TextTemplateNode {
  readonly type: TemplateNodeType.Text;
  readonly data: string;
}

export function createAnhor(label: string): AnchorTemplateNode {
  return {
    type: TemplateNodeType.Anchor,
    label,
  };
}
export interface AnchorTemplateNode {
  readonly type: TemplateNodeType.Anchor;
  readonly label: string;
}
