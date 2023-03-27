import {
  DomDescriptorType,
  ElementDescriptor,
  StaticElementDescriptor,
  StaticTemplate,
} from '../intrinsic/descriptors';
import { DomFactory } from '../render/dom-factory';
import { RenderTarget } from '../render/target';
import { renderStatic } from '../render/render-node';
import { syntheticEvent } from '../render/render-node';
import {
  ApplyEventHandler,
  EventOperation,
  HydrateOperation,
  HydrateOperationType,
} from './hydrate-operation';
import { applyEventOperations, applySignalOperations } from './execute';
import { Attachable } from '../render/attachable';
import { applyCommands, UpdateCommand } from '../reactive';
import { Graph, RenderContext } from '../render/render-context';

export const scopeProp = Symbol('scope');

export class Program implements Attachable {
  public graph: Graph = new Graph();

  constructor(
    public readonly staticTemplate: StaticTemplate[],
    public readonly eventsMap?: Record<
      string | number | symbol,
      EventOperation[]
    >
  ) {}

  static fromElement(
    elementDesc: ElementDescriptor,
    children: Program | StaticTemplate | null
  ) {
    let { template, eventOperations } = staticTemplateFromElement(elementDesc);

    if (children instanceof Program) {
      for (const childTemplate of children.staticTemplate) {
        appendChild(template, childTemplate);
      }

      const childrenOperations = children.eventsMap;

      if (childrenOperations) {
        if (!eventOperations) {
          eventOperations = {};
        }

        for (const eventName in childrenOperations) {
          const operations = childrenOperations[eventName];
          if (operations.length > 0) {
            const parentOperations =
              eventOperations[eventName] ?? (eventOperations[eventName] = []);

            const firstOp = operations[0];
            if (firstOp.type === HydrateOperationType.PushSibling) {
              parentOperations.push({
                type: HydrateOperationType.PushChild,
                index: firstOp.offset,
              });
              for (let i = 1, len = operations.length; i < len; i++) {
                parentOperations.push(operations[i]);
              }
            } else {
              parentOperations.push(
                {
                  type: HydrateOperationType.PushChild,
                  index: 0,
                },
                ...operations
              );
            }
          }
        }
      }

      const program = new Program([template], eventOperations);
      program.graph.append(children.graph);
      return program;
    } else if (children) {
      appendChild(template, children);
    }
    return new Program([template], eventOperations);
  }

  static merge(p1: Program, p2: Program): Program {
    let mergedStaticTemplate = [...p1.staticTemplate];
    let mergedEventsMap = cloneEventsMap(p1.eventsMap);

    let childIndex = mergedStaticTemplate.length;

    mergedStaticTemplate.push(...p2.staticTemplate);

    if (p2.eventsMap) {
      if (!mergedEventsMap) {
        // cloneEventOperations(program.eventOperations);
        mergedEventsMap = {};
      }

      for (const eventName in p2.eventsMap) {
        if (!mergedEventsMap[eventName]) {
          mergedEventsMap[eventName] = [];
        }
        append(mergedEventsMap[eventName], p2.eventsMap[eventName], childIndex);
      }
    }

    const mergedProgram = new Program(mergedStaticTemplate, mergedEventsMap);

    mergedProgram.graph.append(p1.graph);
    mergedProgram.graph.append(p2.graph);

    return mergedProgram;
  }

  attachTo(container: RenderTarget, domFactory: DomFactory = document) {
    const { eventsMap: eventsMap, staticTemplate } = this;
    const contexts: RenderContext[] = [];

    let disposeListeners: undefined | (() => any) = undefined;

    if (eventsMap) {
      const eventNames = Object.keys(eventsMap);
      for (const eventName of eventNames) {
        container.addEventListener(eventName, handler, true);
      }

      disposeListeners = () => {
        for (const eventName of eventNames) {
          container.removeEventListener(eventName, handler, true);
        }
      };
    }

    function handler(originalEvent: Event) {
      const eventName = originalEvent.type;
      const eventOperations = eventsMap![eventName];
      const eventTarget = originalEvent.target as HTMLElement;
      if (!eventTarget) {
        return;
      }

      const currentTarget = originalEvent.currentTarget;

      let rootTarget: HTMLElement = originalEvent.target as HTMLElement;
      let rootFlag: number | undefined = undefined;

      while (rootTarget !== currentTarget) {
        rootFlag = (rootTarget as any)[rootFlagKey];
        if (rootFlag !== undefined) break;
        rootTarget = rootTarget.parentElement!;
      }

      if (rootFlag !== undefined) {
        const nodeIndex = rootFlag & 255;
        const dataIndex = rootFlag >> 8;
        const context = contexts[dataIndex];
        applyEventOperations(
          eventOperations,
          rootTarget,
          nodeIndex,
          (currentTarget, eventHandler) => {
            if (
              eventTarget === currentTarget ||
              currentTarget.contains(eventTarget)
            ) {
              const messages =
                eventHandler instanceof UpdateCommand
                  ? eventHandler
                  : eventHandler instanceof Function
                  ? eventHandler(syntheticEvent(eventName, originalEvent))
                  : eventHandler.handleEvent(
                      syntheticEvent(eventName, originalEvent)
                    );

              applyCommands(context, messages, (state: any) => {
                const key = state[scopeProp];
                if (key === undefined) {
                  return;
                }

                const signalOperations = eventsMap![key];
                if (signalOperations) {
                  let signalNodeIndex = nodeIndex;
                  let signalNodeTarget: HTMLElement | null | undefined =
                    rootTarget;
                  while (signalNodeIndex--) {
                    signalNodeTarget =
                      signalNodeTarget?.previousSibling as HTMLElement;
                  }

                  applySignalOperations(
                    signalOperations,
                    signalNodeTarget!,
                    context
                  );
                }
              });

              return true;
            } else {
              return false;
            }
          }
        );
      }
    }

    const templates: Node[] = [];
    for (let i = 0, len = staticTemplate.length; i < len; i++) {
      const st = staticTemplate[i];
      const rootElement = renderStatic(st, domFactory);
      if (rootElement instanceof HTMLElement) {
        rootElement.setAttribute(rootFlagKey, i.toString());
      }
      templates.push(rootElement);
    }

    return new View(
      this.graph,
      contexts,
      container,
      templates,
      disposeListeners
    );
  }

  asComponent(
    initialize: (view: View) => any
  ): { program: Program } & Attachable {
    const program = this;
    return {
      program,
      attachTo(container: RenderTarget, domFactory: DomFactory) {
        const view = this.program.attachTo(container, domFactory);
        const result = initialize(view);
        if (result) {
          return [view, initialize(view)];
        } else {
          return view;
        }
      },
    };
  }
}

const rootFlagKey = ':x-root';

export class View {
  constructor(
    public graph: Graph,
    public contexts: RenderContext[],
    public container: RenderTarget,
    //    public renderOperations: Program['renderOperations'],
    public templates: Node[],
    public dispose?: () => void
  ) {}

  render() {
    const { templates, container, contexts } = this;
    const dataIdx = contexts.length;
    const context = new RenderContext(new Map(), this.graph);
    contexts.push(context);

    const nodes: Node[] = [];
    for (let nodeIdx = 0, len = templates.length; nodeIdx < len; nodeIdx++) {
      const template = templates[nodeIdx];
      const target = template.cloneNode(true) as any;
      target[rootFlagKey] = (dataIdx << 8) | nodeIdx;
      container.appendChild(target);
      nodes.push(target);
    }
    return nodes;
  }
}

function append(
  operations: HydrateOperation[],
  siblingOperatios: HydrateOperation[],
  childIndex: number
) {
  if (siblingOperatios.length === 0) {
    return;
  }

  let depth = 0;
  let index = 0;
  for (let i = 0, length = operations.length; i < length; i++) {
    const operation = operations[i];
    switch (operation.type) {
      case HydrateOperationType.PushSibling:
        if (depth === 0) {
          index += operation.offset;
        }
        break;
      case HydrateOperationType.PushChild:
        depth++;
        break;
      case HydrateOperationType.PopChild:
        depth--;
        break;
    }
  }

  while (depth > 0) {
    operations.push({ type: HydrateOperationType.PopChild });
    depth--;
  }

  if (childIndex <= index) {
    throw Error(
      `
found operations that possibly could interfere with sibling operations. 
This is probably a bug in compilation logic. 
Please inform the maintainers about this issue.
      `
    );
  }

  const siblingOffset = childIndex - index;

  const firstSiblingOp = siblingOperatios[0];
  if (firstSiblingOp.type === HydrateOperationType.PushSibling) {
    operations.push({
      type: HydrateOperationType.PushSibling,
      offset: siblingOffset + firstSiblingOp.offset,
    });

    for (let i = 1, len = siblingOperatios.length; i < len; i++) {
      operations.push(siblingOperatios[i]);
    }
  } else {
    operations.push({
      type: HydrateOperationType.PushSibling,
      offset: siblingOffset,
    });

    operations.push(...siblingOperatios);
  }
}

function cloneEventsMap(eventOperations: Program['eventsMap']) {
  if (!eventOperations) {
    return undefined;
  }

  const clone: Program['eventsMap'] = {};
  for (const eventName in eventOperations) {
    clone[eventName] = [...eventOperations[eventName]];
  }

  return clone;
}

function appendChild(element: StaticElementDescriptor, child: StaticTemplate) {
  if (element.children instanceof Array) {
    element.children.push(child);
  } else if (element.children) {
    element.children = [element.children, child];
  } else if (child) {
    element.children = child;
  } else {
    debugger;
  }
}

function staticTemplateFromElement(elementDesc: ElementDescriptor) {
  let template: StaticElementDescriptor = {
    type: DomDescriptorType.StaticElement,
    name: elementDesc.name,
  };
  if (elementDesc.attrs) {
    template.attrs = elementDesc.attrs;
  }

  let eventOperations: Record<string, EventOperation[]> | undefined = undefined;

  const events = elementDesc.events;
  if (events) {
    if (!eventOperations) {
      eventOperations = {};
    }

    for (const eventName in events) {
      const operation: ApplyEventHandler = {
        type: HydrateOperationType.ApplyEventHandler,
        handler: events[eventName],
      };

      if (eventOperations[eventName]) {
        eventOperations[eventName].push(operation);
      } else {
        eventOperations[eventName] = [operation];
      }
    }
  }

  return { template, eventOperations };
}
