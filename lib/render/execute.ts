import { DomOperation, DomOperationType } from './dom-operation';
import { ExpressionType } from '../jsx/expression';
import { contextKey } from './symbols';
import { ExecuteContext } from './execute-context';
import { Anchor, RenderTarget } from '../jsx';
import { IDomFactory } from './dom-factory';

export function execute<TExecuteContext extends ExecuteContext>(
  operations: DomOperation<any>[],
  contexts: ArrayLike<TExecuteContext>,
  domFactory: IDomFactory,
  rootNode?: RenderTarget
) {
  let nodeStack: Stack<Node> = { head: rootNode, length: 0 } as any;
  for (
    let contextIdx = 0,
      contextsLen = contexts.length | 0,
      operationLen = operations.length | 0;
    contextIdx < contextsLen;
    contextIdx++
  ) {
    const context = contexts[contextIdx];
    for (let operationIdx = 0; operationIdx < operationLen; operationIdx++) {
      const op = operations[operationIdx];
      switch (op.type) {
        case DomOperationType.AppendText:
          nodeStack.head.appendChild(document.createTextNode(op.value));
          break;
        case DomOperationType.Lazy:
          (context as any)[op.nodeKey] = nodeStack.head;
          break;
        case DomOperationType.Clone:
          const root = op.clone();
          (root as any)[contextKey] = context;
          if (context.rootElement) {
            const { moreRootElements } = context;
            if (moreRootElements) moreRootElements.push(root);
            else context.moreRootElements = [root];
          } else {
            context.rootElement = root;
          }
          nodeStack.head = root;
          nodeStack[0] = root;
          nodeStack.length = 1;
          break;
        case DomOperationType.PushFirstChild:
          let firstChild = nodeStack.head.firstChild as HTMLElement;
          nodeStack[nodeStack.length] = firstChild;
          nodeStack.head = firstChild;
          nodeStack.length++;
          break;
        case DomOperationType.PushNextSibling:
          let nextSibling = nodeStack.head.nextSibling as HTMLElement;
          for (let i = 1; i < op.offset; i++) {
            nextSibling = nextSibling.nextSibling as HTMLElement;
          }
          nodeStack[nodeStack.length - 1] = nextSibling;
          nodeStack.head = nextSibling;
          break;
        case DomOperationType.PushChild:
          let childNode = nodeStack.head.firstChild as HTMLElement;
          for (let i = 0; i < op.index; i++) {
            childNode = childNode.nextSibling as HTMLElement;
          }
          nodeStack[nodeStack.length] = childNode;
          nodeStack.head = childNode;
          nodeStack.length++;
          break;
        case DomOperationType.PopNode:
          if (nodeStack.length === 0) {
            throw Error('reached end of stack');
          }
          const length = nodeStack.length - 1;
          nodeStack.length = length;
          nodeStack.head = nodeStack[length - 1];
          break;
        case DomOperationType.SetAttribute:
          const attrExpr = op.expression;

          const attrElt = nodeStack.head as any;
          (context as any)[op.nodeKey] = attrElt;

          switch (attrExpr.type) {
            case ExpressionType.Property:
              const attrValue = context[attrExpr.name];
              attrElt[op.name] = attrValue;
              // if (attrValue) {
              //   operationStack = {
              //     head: {
              //       key: curr.key,
              //       type: DomOperationType.SetAttribute,
              //       name: curr.name,
              //       expression: {
              //         type: ExpressionType.State,
              //         state: attrValue,
              //       },
              //     },
              //     tail: operationStack,
              //   };
              // }
              break;
            case ExpressionType.Observable:
              attrExpr.observable.subscribe({
                elt: nodeStack.head as HTMLElement,
                name: op.name,
                next(s: string) {
                  const { elt, name } = this;
                  (elt as any)[name] = s;
                },
              });
              break;
          }
          break;
        case DomOperationType.SetClassName:
          const classExpr = op.expression;
          const elt = nodeStack.head as HTMLElement;
          (context as any)[op.nodeKey] = elt;
          const prevValue: string[] = [];
          (context as any)[op.prevKey] = prevValue;
          let classValue: any;

          switch (classExpr.type) {
            // case ExpressionType.Init:
            //   const initResult = classExpr.init(classData, {
            //     node: nodeStack.head,
            //     data: classData,
            //   });
            //   if (isExpression(initResult)) {
            //     operationStack = {
            //       head: {
            //         key: curr.key,
            //         type: DomOperationType.SetClassName,
            //         expression: initResult,
            //         classes,
            //       },
            //       tail: operationStack,
            //     };
            //   } else if (typeof initResult === 'string') {
            //     const cl = (classes && classes[initResult]) || initResult;
            //     const elt = nodeStack.head as HTMLElement;
            //     elt.classList.add(cl);
            //   }
            //   break;
            case ExpressionType.Property:
              classValue = context[classExpr.name];
              break;
            case ExpressionType.Observable:
              const prev: string[] = [];
              const subs = classExpr.observable.subscribe({
                prev,
                classes: op.classes,
                elt: nodeStack.head as HTMLElement,
                next(input) {
                  const s = input instanceof Function ? input(context) : input;
                  const { prev, classes, elt } = this;
                  for (const x of prev) {
                    elt.classList.remove(x);
                  }
                  prev.length = 0;
                  if (s instanceof Array) {
                    const stack = [s];
                    while (stack.length) {
                      const curr = stack.pop();
                      if (curr instanceof Array) {
                        for (let i = 0, len = curr.length; i < len; i++) {
                          stack.push(curr[i]);
                        }
                      } else if (curr) {
                        const cls = classes ? classes[curr] : curr;
                        elt.classList.add(cls);
                        prev.push(cls);
                      }
                    }
                  } else {
                    const cls = classes ? classes[s] : s;
                    elt.classList.add(cls);
                    prev.push(cls);
                  }
                  // for (const x of flatten(s)) {
                  //   const cls = (classes && classes[x]) || x;
                  //   elt.classList.add(cls);
                  //   prev.push(cls);
                  // }
                },
              });
              if (subs)
                if (context.subscriptions) context.subscriptions.push(subs);
                else context.subscriptions = [subs];
              break;

            case ExpressionType.Function:
              classValue = classExpr.func(context);
              break;
            default:
              console.error('not supported ', classExpr);
              // classValue = classExpr.toString();
              // if (classExpr) {
              //   const elt = nodeStack.head as HTMLElement;
              //   for (const x of flatten()) {
              //     const cls = (classes && classes[x]) || x;
              //     elt.classList.add(cls);
              //   }
              // }
              break;
          }

          const classList = elt.classList;

          // const prevValue = context[op.key];
          // (context as any)[op.key] = classValue;
          // if (prevValue instanceof Array) {
          //   for (let i = 0, len = prevValue.length; i < len; i++) {
          //     classList.remove(prevValue[i]);
          //   }
          // } else if (prevValue) {
          //   classList.remove(prevValue);
          // }

          const classes = op.classes;
          if (classValue instanceof Array) {
            for (let i = 0, len = classValue.length; i < len; i++) {
              const x = classValue[i];
              const cls = classes ? classes[x] : x;
              classList.add(cls);
              prevValue.push(cls);
            }
          } else if (classValue) {
            const cls = classes ? classes[classValue] : classValue;
            classList.add(cls);
            prevValue.push(cls);
          }
          break;

        // case DomOperationType.SetClassModule:
        //   const classModuleExpr = op.expression;
        //   let classModuleValue: any;
        //   if (classModuleExpr === _self) {
        //     classModuleValue = context;
        //   } else {
        //     switch (classModuleExpr.type) {
        //       case ExpressionType.Property:
        //         classValue = context[classModuleExpr.name];
        //         break;
        //       default:
        //         classModuleValue = classModuleExpr.toString();
        //         break;
        //     }
        //     const prevValue = context[op.key];
        //     const nextValue: string[] = [];

        //     (context as any)[op.key] = nextValue;

        //     const elt = nodeStack.head as HTMLElement;
        //     const classList = elt.classList;
        //     if (prevValue instanceof Array) {
        //       for (let i = 0, len = prevValue.length; i < len; i++) {
        //         classList.remove(prevValue[i]);
        //       }
        //     }
        //     const classes = op.classes;
        //     if (classModuleValue instanceof Array) {
        //       for (let i = 0, len = classModuleValue.length; i < len; i++) {
        //         const x = classModuleValue[i];
        //         const cls = classes ? classes[x] : x;
        //         classList.add(cls);
        //         nextValue.push(cls);
        //       }
        //     } else if (classModuleValue) {
        //       const cls = classes
        //         ? classes[classModuleValue]
        //         : classModuleValue;
        //       classList.add(cls);
        //       nextValue.push(cls);
        //     }
        //   }
        //   break;

        case DomOperationType.SetTextContent:
          const setContentExpr = op.expression;
          const textNode: Node = nodeStack.head;
          (context as any)[op.nodeKey] = textNode;

          switch (setContentExpr.type) {
            // case ExpressionType.Init:
            //   //   const initResult = setContentExpr.init(data, {
            //   //     node: nodeStack.head,
            //   //     data,
            //   //   });
            //   //   if (isExpression(initResult)) {
            //   //     operationStack = {
            //   //       head: {
            //   //         key: curr.key,
            //   //         type: DomOperationType.SetTextContent,
            //   //         expression: initResult,
            //   //       },
            //   //       tail: operationStack,
            //   //     };
            //   //   } else if (initResult) {
            //   //     if (curr.textNodeIndex !== undefined) {
            //   //       nodeStack.head.childNodes[curr.textNodeIndex].textContent =
            //   //         initResult;
            //   //     } else {
            //   //       nodeStack.head.textContent = initResult;
            //   //     }
            //   //   }
            //   break;
            case ExpressionType.Property:
              textNode.textContent = context[setContentExpr.name] ?? '';
              break;
            case ExpressionType.Observable:
              const { observable } = setContentExpr;

              const stateSubscription = observable.subscribe({
                textNode: nodeStack.head,
                next(newValue) {
                  this.textNode.textContent = newValue;
                },
              });
              if (stateSubscription) {
                if (context.subscriptions)
                  context.subscriptions.push(stateSubscription);
                else context.subscriptions = [stateSubscription];
              }
              break;
          }
          break;
        case DomOperationType.Attachable:
          op.attachable.attachTo(nodeStack.head as HTMLElement);
          break;
        case DomOperationType.Renderable:
          const binding = op.renderable.render(
            new Anchor(nodeStack.head),
            domFactory,
            {
              data: context,
            }
          );
          if (binding) {
            if ('dispose' in binding && binding.dispose instanceof Function)
              if (context.bindings) context.bindings.push(binding);
              else context.bindings = [binding];
            else if (
              'unsubscribe' in binding &&
              binding.unsubscribe instanceof Function
            ) {
              if (context.subscriptions) context.subscriptions.push(binding);
              else context.subscriptions = [binding];
            }
          }
          break;

        // case DomOperationType.Subscribable:
        //   const { subscribable } = op;

        //   const anchor = nodeStack.head;
        //   console.log(anchor);

        //   const stateSubs = subscribable.subscribe({
        //     anchor: anchor,
        //     disposePrev: undefined as Function | undefined,
        //     container: nodeStack.head,
        //     next(newValue) {
        //       // const { disposePrev, anchor, container } = this;
        //       // if (disposePrev instanceof Function) {
        //       //   disposePrev();
        //       // }
        //       // if (newValue instanceof JsxElement) {
        //       //   const execContext: ExecuteContext = {};
        //       //   // const clone = newValue.templateNode.cloneNode(true);
        //       //   execute(newValue.contentOps, [execContext]);
        //       //   // container.insertBefore(clone, anchor);
        //       //   this.disposePrev = function () {
        //       //     // container.removeChild(clone);
        //       //   };
        //       // } else {
        //       //   const textNode = document.createTextNode(newValue);
        //       //   container.insertBefore(textNode, anchor);
        //       //   this.disposePrev = function () {
        //       //     container.removeChild(textNode);
        //       //   };
        //       // }
        //     },
        //   });
        //   if (stateSubs) {
        //     if (context.subscriptions) context.subscriptions.push(stateSubs);
        //     else context.subscriptions = [stateSubs];
        //   }

        //   break;
        default:
          console.error('not supported', op);
          break;
      }
    }
  }
}

type Stack<T> = { [i: number]: T } & { head: T; length: number };
