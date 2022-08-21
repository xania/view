export interface RenderTarget {
  childNodes: ArrayLike<Node>;
  removeChild(node: Node): void;
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  removeEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
  set textContent(value: string | null);
}
