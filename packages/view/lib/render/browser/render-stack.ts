import { Sandbox } from '../../reactivity/sandbox';
import {
  DomDescriptorType,
  isDomDescriptor,
} from '../../intrinsic/descriptors';
import { renderAttr } from './render-attr';
import { SequenceIterator, isIterable } from '../../utils/iterator';
import { State } from '../../reactivity/state';
import { Collection, cpush } from '../../utils/collection';
import {
  ForEachExpression,
  Transformer,
  isAttachable,
  isViewable,
} from '../../render';
import { isSubscribable, isSubscription } from '../../utils/observable';
import { isDisposable } from '../../render/disposable';
import { ListExpression, ListMutations, diff } from '../../reactivity/list';

import { MutationOperator } from './mutation-operator';
import { Effect, Reactive, isCommand } from '../../reactivity';
import { AnchorNode, ElementNode, NodeFactory, ViewNode } from '../../factory';
import { smap } from '../../seq';

const PopTransformer = Symbol('pop-transformer');
const ResetRoot = Symbol('set-root');

type Instruction<TElement, TNode> =
  | typeof PopTransformer
  | typeof ResetRoot
  | ResetTarget<TElement, TNode>
  | JSX.Children
  | SequenceIterator;

type RenderContext = {
  transformers: Transformer<any>['transform'][];
  isRoot: boolean;
  promises?: Collection<Promise<any>>;
};

export function renderStack<
  TElement extends ElementNode,
  TNode extends ViewNode
>(
  sandbox: Sandbox,
  template: JSX.Children,
  factory: NodeFactory<TElement, TNode>,
  currentTarget: TElement | AnchorNode<TNode>
) {
  const context: RenderContext = { transformers: [], isRoot: true };
  run([template], currentTarget, context);
  return context.promises;

  function run(
    stack: Instruction<TElement, TNode>[],
    currentTarget: TElement | AnchorNode<TNode>,
    context: RenderContext = { transformers: [], isRoot: true }
  ) {
    const { transformers } = context;

    while (stack.length) {
      const curr = stack.pop()!;

      if (curr === PopTransformer) {
        transformers.pop();
        continue;
      } else if (curr === ResetRoot) {
        context.isRoot = true;
        continue;
      } else if (curr instanceof ResetTarget) {
        currentTarget = curr.target;
        continue;
      }
      const tpl = curr;

      if (sandbox.disposed || tpl === null || tpl === undefined) {
        continue;
      } else if (tpl instanceof Function) {
        stack.push(tpl());
      } else if (tpl instanceof Array) {
        for (let i = tpl.length - 1; i >= 0; i--) {
          const item = tpl[i];
          if (item !== null && item !== undefined) {
            stack.push(item);
          }
        }
      } else if (tpl instanceof SequenceIterator) {
        const next = tpl.iter.next();
        if (!next.done) {
          stack.push(tpl);
        }
        stack.push(next.value);
      } else if (tpl instanceof Promise) {
        const promiseTransformers = transformers.slice(0);
        context.promises = cpush(
          context.promises,
          tpl.then((resolved): any => {
            if (resolved) {
              stack.push(resolved);
            }

            return run(stack, currentTarget, {
              transformers: promiseTransformers,
              isRoot: context.isRoot,
            });
          })
        );
      } else if (isIterable(tpl)) {
        stack.push(new SequenceIterator(tpl));
      } else if (tpl.constructor === String) {
        const textNode = factory.createTextNode(currentTarget, tpl as string);
        if (context.isRoot) {
          sandbox.nodes = cpush(sandbox.nodes, textNode);
        }
      } else if (tpl.constructor === Number) {
        const textNode = factory.createTextNode(currentTarget, String(tpl));
        if (context.isRoot) {
          sandbox.nodes = cpush(sandbox.nodes, textNode);
        }
      } else if (tpl instanceof Reactive) {
        const stateNode = factory.createTextNode(currentTarget, '');
        if (context.isRoot) {
          sandbox.nodes = cpush(sandbox.nodes, stateNode);
        }

        sandbox.track(tpl.export(stateNode, 'data'));
      } else if (tpl instanceof ForEachExpression) {
        tpl.render(sandbox, factory);
      } else if (tpl instanceof ListExpression) {
        const source = tpl.source;

        if (source instanceof Array) {
          for (let i = source.length - 1; i >= 0; i--) {
            const template = smap(
              tpl.children,
              (e) => e,
              new State(source[i])
            ) as JSX.Element;
            stack.push(template);
          }
        } else {
          const listAnchorNode = factory.createComment(currentTarget, '');
          if (context.isRoot) {
            sandbox.nodes = cpush(sandbox.nodes, listAnchorNode);
          }

          const mutations =
            source instanceof ListMutations ? source : source.pipe(diff);

          const listItem = new State();
          const template = smap(
            tpl.children,
            (e) => e,
            listItem
          ) as JSX.Element;
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
      } else if (tpl instanceof Transformer) {
        transformers.push(tpl.transform);
        stack.push(PopTransformer);
        stack.push(tpl.children);
      } else if (isDomDescriptor(tpl)) {
        switch (tpl.type) {
          case DomDescriptorType.Element:
            if (!factory.createElement) {
              debugger;
            }
            const element = factory.createElement(currentTarget, tpl.name);

            if (context.isRoot) {
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
                  context.isRoot
                );
              }
            }

            const { children } = tpl;
            if (children ?? true) {
              if (context.isRoot) {
                context.isRoot = false;
                stack.push(ResetRoot);
              }

              stack.push(new ResetTarget(currentTarget), [children]);
              currentTarget = element;
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
              context.isRoot
            );
            break;
          default:
            console.log('dom', tpl);
            break;
        }
      } else if (isViewable(tpl)) {
        stack.push(tpl.view());
      } else if (isAttachable(tpl)) {
        stack.push(tpl.attachTo(currentTarget as any, factory, sandbox));
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
      } else if (isCommand(tpl)) {
        sandbox.handleCommands(tpl, currentTarget as any);
      } else {
        for (const transform of transformers) {
          const value = transform(tpl);
          if (value !== tpl) {
            stack.push(value);
            break;
          }
        }
      }
    }
  }
}

class ResetTarget<TElement, TNode> {
  constructor(public target: TElement | AnchorNode<TNode>) {}
}
