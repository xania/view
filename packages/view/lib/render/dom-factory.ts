﻿export interface DomFactory {
  createElement(name: string): HTMLElement;
  createTextNode(value: string): Text;
}
