import { Sandbox } from '../../reactivity/sandbox';
import {
  DomDescriptorType,
  isDomDescriptor,
} from '../../intrinsic/descriptors';
import { renderAttr } from './render-attr';
import { SequenceIterator, isIterable } from '../../utils/iterator';
import { Component } from '../../component';
import { State } from '../../reactivity/state';
import { cpush } from '../../utils/collection';
import { isAttachable, isViewable } from '../../render';
import { isSubscribable, isSubscription } from '../../utils/observable';
import { isDisposable } from '../../render/disposable';
import {
  ListExpression,
  ListItem,
  ListMutations,
  diff,
} from '../../reactivity/list';

import { MutationOperator } from './mutation-operator';
import { Effect, Reactive, isCommand } from '../../reactivity';
import { sapply } from '../../seq';
import { AnchorNode, ElementNode, NodeFactory, ViewNode } from '../../factory';

export function renderStack<
  TElement extends ElementNode,
  TNode extends ViewNode
>(
  stack: [
    Sandbox,
    TElement | AnchorNode<TNode>,
    JSX.Children | SequenceIterator,
    boolean
  ][],
  factory: NodeFactory<TElement, TNode>
) {
  while (stack.length) {
    const [sandbox, currentTarget, tpl, isRoot] = stack.pop()!;

    if (sandbox.disposed || tpl === null || tpl === undefined) {
      continue;
    } else if (tpl instanceof Array) {
      for (let i = tpl.length - 1; i >= 0; i--) {
        const item = tpl[i];
        if (item !== null && item !== undefined) {
          stack.push([sandbox, currentTarget, item, isRoot]);
        }
      }
    } else if (tpl instanceof SequenceIterator) {
      const next = tpl.iter.next();
      if (!next.done) {
        stack.push([sandbox, currentTarget, tpl, isRoot]);
      }
      stack.push([sandbox, currentTarget, next.value, isRoot]);
    } else if (tpl.constructor === String) {
      const textNode = factory.createTextNode(currentTarget, tpl as string);
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, textNode);
      }
    } else if (tpl.constructor === Number) {
      const textNode = factory.createTextNode(currentTarget, String(tpl));
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, textNode);
      }
    } else if (tpl instanceof Component) {
      stack.push([sandbox, currentTarget, tpl.execute(), isRoot]);
    } else if (tpl instanceof Reactive) {
      const stateNode = factory.createTextNode(currentTarget, '');
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, stateNode);
      }

      sandbox.track(tpl.assign(stateNode, 'data'));
    } else if (tpl instanceof ListExpression) {
      const source = tpl.source;

      if (source instanceof Array) {
        for (let i = source.length - 1; i >= 0; i--) {
          const template = sapply(tpl.children, [
            new State(source[i]),
          ]) as JSX.Element;
          stack.push([sandbox, currentTarget, template, isRoot]);
        }
      } else {
        const listAnchorNode = factory.createComment(currentTarget, '');
        if (isRoot) {
          sandbox.nodes = cpush(sandbox.nodes, listAnchorNode);
        }

        const rowIndexKey = Symbol();

        const mutations =
          source instanceof ListMutations ? source : source.pipe(diff);

        const listItem = new State();
        const template = sapply(tpl.children, [listItem]) as JSX.Element;
        const anchorElement = AnchorNode.create(listAnchorNode)!;

        const operator = new MutationOperator(
          sandbox,
          template,
          anchorElement,
          listItem,
          factory
        );
        sandbox.track(mutations.effect(operator.effect));
      }
    } else if (tpl instanceof Effect) {
      sandbox.track(tpl);
    } else if (tpl instanceof Promise) {
      sandbox.promises = cpush(
        sandbox.promises,
        tpl.then((resolved): any => {
          if (resolved) {
            stack.push([sandbox, currentTarget, resolved, isRoot]);
          }
          renderStack(stack, factory);
        })
      );
    } else if (isDomDescriptor(tpl)) {
      switch (tpl.type) {
        case DomDescriptorType.Element:
          const element = factory.createElement(currentTarget, tpl.name);

          if (isRoot) {
            sandbox.nodes = cpush(sandbox.nodes, element);
          }

          const { attrs } = tpl;
          if (attrs) {
            for (const attrName in attrs) {
              const attrValue = attrs[attrName];

              renderAttr(
                factory,
                sandbox,
                element as ElementNode,
                attrName,
                attrValue,
                isRoot
              );
            }
          }

          const { children } = tpl;
          if (children ?? true) {
            renderStack([[sandbox, element, children, false]], factory);
          }
          break;
        case DomDescriptorType.Attribute:
          if (currentTarget instanceof AnchorNode) {
            throw 'cannot set attributes on anchor element';
          }
          renderAttr(
            factory,
            sandbox,
            currentTarget,
            tpl.name,
            tpl.value,
            isRoot
          );
          break;
        default:
          console.log('dom', tpl);
          break;
      }
    } else if (isViewable(tpl)) {
      stack.push([sandbox, currentTarget, tpl.view(), isRoot]);
    } else if (isAttachable(tpl)) {
      stack.push([
        sandbox,
        currentTarget,
        tpl.attachTo(currentTarget as any, factory),
        isRoot,
      ]);
    } else if (isSubscribable(tpl)) {
      sandbox.subscriptions = cpush(
        sandbox.subscriptions,
        tpl.subscribe({
          next(command) {
            sandbox.handleCommands(command, currentTarget as any);
          },
        })
      );
    } else if (isDisposable(tpl)) {
      sandbox.disposables = cpush(sandbox.disposables, tpl);
    } else if (isSubscription(tpl)) {
      sandbox.subscriptions = cpush(sandbox.subscriptions, tpl);
      // } else if (isCommand(curr)) {
      //   context.handleCommands(curr);
    } else if (isIterable(tpl)) {
      stack.push([sandbox, currentTarget, new SequenceIterator(tpl), isRoot]);
    } else if (isCommand(tpl)) {
      sandbox.handleCommands(tpl, currentTarget as any);
    } else {
      console.log('unknown', tpl);
    }
  }
}
