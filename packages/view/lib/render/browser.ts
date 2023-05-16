import { AnchorNode, CommentNode, NodeFactory, TextNode } from '../factory';
import { Sandbox, isCommand } from '../reactivity';
import { syntheticEvent } from './event';

function namespaceUri(name: string, defaultUri: string | null) {
  return name === 'svg'
    ? 'http://www.w3.org/2000/svg'
    : defaultUri ?? 'http://www.w3.org/1999/xhtml';
}

export class Browser implements NodeFactory<Element, any> {
  events: Record<string, [Element, JSX.EventHandler, Sandbox][]> | undefined;

  constructor(public container: Element) {}

  createElement(
    parentElement: Element | AnchorNode<Element>,
    name: string
  ): Element {
    if (parentElement instanceof AnchorNode) {
      const anchorNode = parentElement.anchorNode;
      const element = document.createElementNS(
        namespaceUri(name, anchorNode.namespaceURI),
        name
      );
      anchorNode.before(element);
      return element;
    } else {
      const element = document.createElementNS(
        namespaceUri(name, parentElement.namespaceURI),
        name
      );
      parentElement.appendChild(element);
      return element;
    }
  }

  createTextNode(parentElement: Element, data: string): TextNode {
    const textNode = document.createTextNode(data);
    parentElement.appendChild(textNode);

    return textNode as any;
  }
  createComment(parentElement: Element, data: string): CommentNode {
    const commentNode = document.createComment(data);
    parentElement.appendChild(commentNode);
    return commentNode as any;
  }

  applyEvent(
    sandbox: Sandbox,
    target: Element,
    eventName: string,
    eventHandler: JSX.EventHandler
  ) {
    const { events } = this;
    if (events === undefined) {
      this.events = {
        [eventName]: [[target, eventHandler, sandbox]],
      };
      this.container.addEventListener(eventName, this, true);
    } else if (events[eventName]) {
      events[eventName].push([target, eventHandler, sandbox]);
    } else {
      events[eventName] = [[target, eventHandler, sandbox]];
      this.container.addEventListener(eventName, this, true);
    }
  }

  async handleEvent(originalEvent: Event) {
    const eventName = originalEvent.type;

    {
      const events = this.events;
      if (!events) {
        return;
      }
      const delegates = events[eventName];
      if (!delegates) {
        return;
      }

      for (const dlg of delegates) {
        const [target, eventHandler, sandbox] = dlg as any;

        if (sandbox.disposed) {
          // TODO remove disposed from list
          continue;
        }

        if (target.contains(originalEvent.target as any)) {
          let eventObj: any = null;

          eventObj ??= syntheticEvent(eventName, originalEvent, target);

          if (eventHandler instanceof Function) {
            const command = eventHandler(eventObj);
            if (command) {
              sandbox.handleCommands(command, target);
            }
          } else if (isCallable(eventHandler)) {
            sandbox.handleCommands(eventHandler.call(eventObj), target);
          } else if (!isCommand(eventHandler)) {
            sandbox.handleCommands(eventHandler.handleEvent(eventObj), target);
          } else {
            sandbox.handleCommands(eventHandler, target);
          }
        }
      }
    }
  }
}

function isCallable(value: any): value is { call: Function } {
  return (
    value !== null &&
    value !== undefined &&
    'call' in value &&
    value.call instanceof Function
  );
}
