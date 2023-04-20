import { Sandbox } from '../../reactivity/sandbox';
import {
  DomDescriptorType,
  isDomDescriptor,
} from '../../intrinsic/descriptors';
import { renderAttr } from './render-attr';
import { SequenceIterator, isIterable } from '../../utils/iterator';
import { Component } from '../../component';
import { Effect, Model, State } from '../../reactivity/state';
import { OperatorType } from '../../reactivity/operator';
import { cpush } from '../../reactivity/collection';
import { isAttachable, isViewable } from '../../render';
import { isSubscribable } from '../../reactive/observable';
import { isDisposable } from '../../render/disposable';
import { isSubscription } from '../../render/subscibable';
import { ListExpression, ListMutationState, diff } from '../../reactivity/list';

import { MutationOperator } from './mutation-operator';
import { AnchorElement } from './anchor-element';
import { isCommand } from '../../reactivity';
import { tmap } from '../../seq';

export function renderStack(
  stack: [
    Sandbox,
    Element | AnchorElement,
    JSX.Children | SequenceIterator,
    boolean
  ][]
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
      const textNode = document.createTextNode(tpl as string);
      currentTarget.appendChild(textNode);
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, textNode);
      }
    } else if (tpl.constructor === Number) {
      const textNode = document.createTextNode(String(tpl));
      currentTarget.appendChild(textNode);
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, textNode);
      }
    } else if (tpl instanceof Component) {
      stack.push([sandbox, currentTarget, tpl.execute(), isRoot]);
    } else if (tpl instanceof State) {
      const stateNode = document.createTextNode('');
      currentTarget.appendChild(stateNode);
      if (isRoot) {
        sandbox.nodes = cpush(sandbox.nodes, stateNode);
      }

      sandbox.connect(tpl, {
        type: OperatorType.Assign,
        target: stateNode,
        property: 'data',
      });
    } else if (tpl instanceof ListExpression) {
      const source = tpl.source;

      if (source instanceof Array) {
        for (let i = source.length - 1; i >= 0; i--) {
          const template = itemTemplate(tpl.children, new State(source[i]));
          stack.push([sandbox, currentTarget, template, isRoot]);
        }
      } else {
        const listAnchorNode = document.createComment('');
        currentTarget.appendChild(listAnchorNode);
        if (isRoot) {
          sandbox.nodes = cpush(sandbox.nodes, listAnchorNode);
        }

        const template = itemTemplate(tpl.children, new Model());
        sandbox.connect(
          source instanceof ListMutationState ? source : source.pipe(diff),
          new MutationOperator(
            template,
            AnchorElement.create(sandbox.container, listAnchorNode)!
          )
        );
      }
    } else if (tpl instanceof Effect) {
      sandbox.connect(tpl.state, tpl);
    } else if (tpl instanceof Promise) {
      sandbox.promises = cpush(
        sandbox.promises,
        tpl.then((resolved): any => {
          if (resolved) {
            stack.push([sandbox, currentTarget, resolved, isRoot]);
          }
          renderStack(stack);
        })
      );
    } else if (isDomDescriptor(tpl)) {
      switch (tpl.type) {
        case DomDescriptorType.Element:
          const namespaceUri =
            tpl.name === 'svg'
              ? 'http://www.w3.org/2000/svg'
              : (currentTarget as HTMLElement).namespaceURI ??
                'http://www.w3.org/1999/xhtml';
          const element = document.createElementNS(namespaceUri, tpl.name);

          currentTarget.appendChild(element);
          if (isRoot) {
            sandbox.nodes = cpush(sandbox.nodes, element);
          }

          const { attrs } = tpl;
          if (attrs) {
            for (const attrName in attrs) {
              const attrValue = attrs[attrName];

              renderAttr(sandbox, element as Element, attrName, attrValue);
            }
          }

          const { children } = tpl;
          if (children ?? true) {
            renderStack([[sandbox, element, children, false]]);
          }
          break;
        case DomDescriptorType.Attribute:
          renderAttr(sandbox, currentTarget as Element, tpl.name, tpl.value);
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
        tpl.attachTo(currentTarget, document),
        isRoot,
      ]);
    } else if (isSubscribable(tpl)) {
      sandbox.subscriptions = cpush(
        sandbox.subscriptions,
        tpl.subscribe({
          next(command) {
            sandbox.handleCommands(command, currentTarget);
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
      sandbox.handleCommands(tpl, currentTarget);
    } else {
      console.log('unknown', tpl);
    }
  }
}

function itemTemplate(children: JSX.Children, model: State) {
  return tmap(children, (child) => {
    if (child instanceof Function) {
      return child(model);
    } else {
      return child;
    }
  });
}
