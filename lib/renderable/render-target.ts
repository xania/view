export interface RenderTarget {
  childNodes: ArrayLike<ChildNode>;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
}
