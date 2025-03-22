import { describe, expect, it } from 'vitest';
import { jsx } from '../../jsx-runtime';
import { render, ITextNode } from './render';
import { Arrow, useSignal, useState } from './signal';

describe('render', () => {
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

  it('simple state', () => {
    // prepare view
    const view = ['state: ', useState(1)];

    // render view
    const root = new ViewElementNode('root');
    render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual('<root>state: 1</root>');
  });

  it('composed state', async () => {
    // prepare view
    const view = ['state: ', useState(Promise.resolve(1)).map((x) => x + 1)];

    // render view
    const root = new ViewElementNode('root');
    await render(view, root, TestNodeFactory);

    // assert
    expect(root.toString()).toEqual('<root>state: 2</root>');
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

  it('simple state update', async () => {
    // prepare view
    const state = useState(1);
    const view = ['state: ', state];

    // render view
    const root = new ViewElementNode('root');
    const sandbox = await render(view, root, TestNodeFactory);

    expect(root.toString()).toEqual('<root>state: 1</root>');

    sandbox.update(state, 2);

    // assert;
    expect(root.toString()).toEqual('<root>state: 2</root>');
  });

  it('derived state update', async () => {
    // prepare view
    const state = useState(1);
    const derived01 = state.map((x) => x + 1);
    const derived02 = state.map((x) => x + 2);
    const view = ['state: ', derived01, '-', derived02];

    // render view
    const root = new ViewElementNode('root');
    const sandbox = await render(view, root, TestNodeFactory);

    expect(root.toString()).toEqual('<root>state: 2-3</root>');

    sandbox.update(state, 2);

    // assert;
    expect(root.toString()).toEqual('<root>state: 3-4</root>');
  });

  it('async state', async () => {
    const state = useState(Promise.resolve(1));
    const derived = state.map((x) => Promise.resolve(x + 1));
    const view = ['state: ', state, '-', derived];

    const root = new ViewElementNode('root');
    const sandbox = await render(view, root, TestNodeFactory);

    await sandbox.update(state, Promise.resolve(2));

    expect(root.toString()).toEqual('<root>state: 2-3</root>');
  });
});

type ViewNode = ViewElementNode | ViewTextNode;

class ViewTextNode implements ITextNode {
  constructor(public nodeValue: string | number | String | Number | null) {}

  toString() {
    return this.nodeValue;
  }
}

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

  static appendText(
    container: ViewElementNode,
    content: ViewTextNode['nodeValue']
  ): ViewTextNode {
    const node = new ViewTextNode(content);
    container.children.push(node);
    return node;
  }
}

type ref = HTMLElementTagNameMap['div'];
