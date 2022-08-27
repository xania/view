import {
  DomEventOperation,
  DomNavigationOperation,
  DomRenderOperation,
} from './dom-operation';

export class CompileResult {
  constructor(public customization: NodeCustomization) {}
}

export type NodeCustomization = {
  index: number;
  templateNode: Node;
  render: (DomNavigationOperation | DomRenderOperation)[];
  events: { [event: string]: (DomNavigationOperation | DomEventOperation)[] };
  updates: { [event: string]: (DomNavigationOperation | DomRenderOperation)[] };
};
