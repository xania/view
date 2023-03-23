export type RenderTarget = {
  appendChild(node: Node): any;
  removeEventListener: Node['removeEventListener'];
  addEventListener: Node['addEventListener'];
};
