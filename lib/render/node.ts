export interface INode {
  insertBefore<T extends INode>(node: T, child: INode | null): T;
  childNodes: ArrayLike<INode>;
  firstChild: INode;
  nextSibling: INode;
  textContent: string | null;
  parentElement: IHTMLElement | null;
  appendChild(node: INode): void;
  remove(): void;
}

export interface IHTMLElement extends INode {
  classList: IListOf<string>;

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: IHTMLElement, ev: HTMLElementEventMap[K]) => any,
    opts?: boolean | EventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (this: IHTMLElement, ev: HTMLElementEventMap[K]) => any,
    opts?: boolean | EventListenerOptions
  ): void;
}

export interface IText extends INode {}

export interface IComment extends INode {}

interface IListOf<T> {
  add(value: T): void;
}
