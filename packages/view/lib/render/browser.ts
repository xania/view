import { CommentNode, NodeFactory, TextNode } from '../factory';
import { Sandbox, isCommand } from '../reactivity';
import { syntheticEvent } from './event';

export class Browser implements NodeFactory<Element, any> {
  listeners: Record<string, Sandbox<Element>[]> | undefined;

  constructor(public container: Element) {}

  createElement(parentElement: Element, name: string): Element {
    const namespaceUri =
      name === 'svg'
        ? 'http://www.w3.org/2000/svg'
        : parentElement.namespaceURI ?? 'http://www.w3.org/1999/xhtml';
    const element = document.createElementNS(namespaceUri, name);

    parentElement.appendChild(element);

    return element;
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

  addListener(eventName: string, sandbox: Sandbox<Element>) {
    const { listeners } = this;
    if (listeners === undefined) {
      this.listeners = {
        [eventName]: [sandbox],
      };
      this.container.addEventListener(eventName, this, true);
    } else if (listeners[eventName]) {
      listeners[eventName].push(sandbox);
    } else {
      listeners[eventName] = [sandbox];
      this.container.addEventListener(eventName, this, true);
    }
  }

  async handleEvent(originalEvent: Event) {
    const { listeners } = this;
    if (!listeners) {
      return;
    }

    const eventName = originalEvent.type;
    const sandboxes = listeners[eventName];

    if (!sandboxes) {
      return;
    }
    for (const sandbox of sandboxes) {
      if (sandbox.disposed) {
        // TODO remove disposed from list
        continue;
      }

      const events = sandbox.events;
      if (!events) {
        continue;
      }
      const delegates = events[eventName];
      if (!delegates) {
        continue;
      }

      for (const dlg of delegates) {
        const [target, eventHandler] = dlg as any;
        if (target.contains(originalEvent.target as any)) {
          let eventObj: any = null;

          eventObj ??= syntheticEvent(eventName, originalEvent, target);

          if (eventHandler instanceof Function) {
            const command = eventHandler(eventObj);
            if (command) {
              sandbox.handleCommands(command, target);
            }
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
