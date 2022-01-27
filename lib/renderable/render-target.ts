export interface RenderTarget {
  appendChild(node: Node): void;
  addEventListener(type: string, handler: (evt: Event) => void): void;
  insertBefore: Node['insertBefore'];
}
