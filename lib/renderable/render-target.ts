export interface RenderTarget {
  childNodes: ArrayLike<Node>;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
  contains: Node['contains'];
}
