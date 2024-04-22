import { describe, expect, it } from 'vitest';
import { execute } from './lib/execute';
import { TreeNode, TextNode, ElementNode } from './tree';
import { compile } from './lib/compile';
import { useState } from '../reactivity';
import { ExecutionScope } from './lib/execution-scope';
import { forEach, popScope, pushScope } from './lib';

describe('reactive control operations', () => {
  it('iterates', () => {
    // arrange
    const values = ['ibrahim', 'ben Salah'];
    const operations = forEach(values).map(compile)!;
    const container = new ElementNode();

    // act
    execute<TreeNode>(operations, container);

    // assert
    expect(container.children).toHaveLength(2);
    expect(container.children[0].textContent).toBe(values[0]);
    expect(container.children[1].textContent).toBe(values[1]);
  });

  it('creates text node', () => {
    // arrange
    const view = 'hello world';
    const operations = compile(view);
    const container = new ElementNode();

    // act
    execute<TreeNode>(operations, container);

    // assert
    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe(view);
  });

  it('creates async text node', async () => {
    // arrange
    const operations = compile(Promise.resolve('hello world'));
    const container = new ElementNode();

    // act
    await execute<TreeNode>(operations, container);

    // assert
    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe('hello world');
  });

  it('creates multiple nodes', async () => {
    // arrange
    const operations = compile(['hello world 1', 'hello world 2']);
    const container = new ElementNode();

    // act
    await execute<TreeNode>(operations, container);

    // assert
    expect(container.children).toHaveLength(2);
    expect(container.children[0].textContent).toBe('hello world 1');
    expect(container.children[1].textContent).toBe('hello world 2');
  });

  it('creates async nodes in order', async () => {
    // arrange
    const operations = compile([
      Promise.resolve('text 1'),
      'text 2',
      Promise.resolve('text 3'),
    ]);
    const container = new ElementNode();

    // act
    await execute<TreeNode>(operations, container);

    // assert
    expect(container.children).toHaveLength(3);
    expect(container.children[0].textContent).toBe('text 1');
    expect(container.children[1].textContent).toBe('text 2');
    expect(container.children[2].textContent).toBe('text 3');
  });

  it('creates text node from state', async () => {
    // arrange
    const state = useState(123);
    const container = new ElementNode();

    // act
    const operations = compile(state);
    await execute(operations, container);

    // assert
    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe(state.initial);
  });

  it('iterates with scoped templates', async () => {
    // arrange
    const values = [{ firstName: 'ibrahim', lastName: 'ben Salah' }];
    const operations = forEach(values).map((scope) =>
      compile(scope.prop('firstName'))
    )!;
    const container = new ElementNode();
    // act TODO
    // execute<TreeNode>(operations, container);
    // assert
    // expect(container.children).toHaveLength(1);
    // expect(container.children[0].textContent).toBe(values[0].firstName);
  });

  it('synchronized with changing state', async () => {
    // arrange
    const state = useState(123);
    const renderScope = new ExecutionScope();
    const operations = [pushScope(renderScope), ...compile(state), popScope()];
    const container = new ElementNode();

    // act
    await execute<TreeNode>(operations, container);

    console.log(renderScope);

    renderScope.emit(state, 321);

    // assert
    expect(container.children).toHaveLength(1);
  });
});

function testNodeFactory(scope: ExecutionScope) {
  const textNode = new TextNode();
  textNode.textContent = scope.context;
  return textNode;
}
