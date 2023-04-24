import { describe, it } from 'vitest';
import { Sandbox } from '../reactivity';
import { renderStack } from '../lib/render/browser/render-stack';
import {
  CommentNode,
  ElementNode,
  NodeFactory,
  TextNode,
} from '../lib/factory';

class Factory implements NodeFactory {
  createElementNS(namespaceUri: string, name: string): ElementNode {
    throw new Error('Method not implemented.');
  }
  createTextNode(data: string): TextNode {
    throw new Error('Method not implemented.');
  }
  createComment(data: string): CommentNode {
    throw new Error('Method not implemented.');
  }
}

describe('sandbox', () => {
  const factory = new Factory();
  it('view', () => {
    const element = {} as ElementNode;

    const sandbox = new Sandbox(element);
    const template = <div>xania</div>;

    renderStack([[sandbox, element, template, true]], factory);
    console.log(template);
  });
});
