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

  constructor(public container: Element) { }

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

    const events = this.events;
    if (!events) {
      return;
    }
    const delegates = events[eventName];
    if (!delegates) {
      return;
    }

    for (const delegate of delegates) {
      const [target, handle, sandbox] = delegate as any;

      if (sandbox.disposed) {
        // TODO remove disposed from list
        continue;
      }

      if (target.contains(originalEvent.target)) {
        let eventObject: any = null;

        eventObject ??= syntheticEvent(eventName, originalEvent, target);

        const handleList = [handle];

        for (let i = 0; i < handleList.length; i++) {
          const handle = handleList[i];
    
          if (Array.isArray(handle)) {
            handleList.splice(i + 1, 0, ...handle)
          } else if (handle instanceof Function) {
            const command = handle(eventObject);
            if (command) {
              sandbox.handleCommands(command, target);
            }
          } else if (isCallable(handle)) {
            sandbox.handleCommands(handle.call(eventObject), target);
          } else if (!isCommand(handle)) {
            sandbox.handleCommands(handle.handleEvent(eventObject), target);
          } else {
            sandbox.handleCommands(handle, target);
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
