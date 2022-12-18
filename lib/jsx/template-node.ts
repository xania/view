export interface TemplateNode {}

export class TagTemplateNode implements TemplateNode {
  public classList: string[] = [];
  public childNodes: TemplateNode[] = [];
  public attrs: Record<string, any> = {};

  constructor(public name: string) {}
}

export class TextTemplateNode implements TemplateNode {
  constructor(public data: string) {}
}

export class AnchorTemplateNode implements TemplateNode {
  constructor(public label: string) {}
}
