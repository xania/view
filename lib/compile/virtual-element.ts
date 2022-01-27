import { ElementRef } from '../abstractions/element';
import { RenderTarget } from '../renderable/render-target';

export class VirtualElement implements RenderTarget {
  constructor(private containerElement: ElementRef) {}

  appendChild(node: Node): void {
    this.containerElement.appendChild(node);
  }
  insertBefore<T extends Node>(node: T, child: Node | null) {
    this.containerElement.insertBefore(node, child);
    return node;
  }
  addEventListener(type: string, handler: (evt: Event) => void): void {
    this.containerElement.addEventListener(type, handler);
  }
}
