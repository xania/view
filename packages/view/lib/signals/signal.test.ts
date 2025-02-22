import { describe, expect, it } from 'vitest';
import { jsx } from '../../jsx-runtime';
import { render } from './render';
import { useState } from './signal';

describe('signals', () => {
  it('trivial', () => {
    // prepare view
    const view = 'sample view';

    // render view
    const root = new ViewElementNode('root');
    render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual('<root>sample view</root>');
  });

  it('trivial async', async () => {
    // prepare view
    const view = Promise.resolve('sample view');

    // render view
    const root = new ViewElementNode('root');
    await render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual('<root>sample view</root>');
  });

  it('simple signal', () => {
    // prepare view
    const view = ['count: ', useState(1)];

    // render view
    const root = new ViewElementNode('root');
    render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual('<root>count: 1</root>');
  });

  it('render element', () => {
    // prepare view
    const view = jsx('div', {
      children: ['hello'],
      class: 'section-1',
    });

    // render view
    const root = new ViewElementNode('root');
    render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual(
      '<root><div class="section-1">hello</div></root>'
    );
  });
});

type ViewNode = ViewElementNode | string | String;

class ViewElementNode {
  public children: ViewNode[] = [];

  constructor(
    public tagName: string,
    public attrs?: Record<string, any>
  ) {}

  toString() {
    let output = '<' + this.tagName;

    const { attrs } = this;
    if (attrs) {
      for (const attrName in attrs) {
        output += ` ${attrName}="${attrs[attrName]}"`;
      }
    }

    output += '>';

    const { children } = this;
    for (const child of children) {
      if (child !== null && child !== undefined) {
        output += child.toString();
      }
    }

    output += `</${this.tagName}>`;

    return output;
  }
}

class TestNodeFactory {
  static appendElement(
    container: ViewElementNode,
    name: string,
    attrs: Record<string, any>
  ): ViewElementNode {
    const child = new ViewElementNode(name, attrs);
    container.children.push(child);
    return child;
  }

  static appendText(container: ViewElementNode, content: string | String) {
    container.children.push(content);
  }
}

type ref = HTMLElementTagNameMap['div'];
