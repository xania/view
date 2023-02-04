﻿import { Anchor, DomContentOperation, JsxElement, RenderTarget } from '../jsx';
import { ExpressionType } from '../jsx/expression';
import {
  TagTemplateNode,
  TemplateNode,
  TemplateNodeType,
} from '../jsx/template-node';
import { DomOperationType } from '../render';
import { IDomFactory } from '../render/dom-factory';
import { execute } from '../render/execute';
import { JsxEvent } from '../render/listen';

const primitives = ['number', 'bigint', 'boolean'];

type SsrEvent = { type: string; src: string; name: string; args: any[] };

interface ResponseWriter {
  write(str: string): void;
}
export async function hibernateJsx(this: JsxElement, res: ResponseWriter) {
  const hydrationKey = new Date().getTime().toString();

  const { contentOps, templateNode } = this;
  const domFactory: IDomFactory<SsrTagNode> = {
    appendAnchor: function (target: RenderTarget<SsrTagNode>, text: string) {
      // throw new Error('Function not implemented.');
      debugger;
    },
    appendTag: function (
      target: RenderTarget<SsrTagNode>,
      tag: TagTemplateNode
    ): SsrTagNode {
      if (target instanceof Anchor<any>) {
        const tagNode = SsrTagNode.fromTemplate(tag, target.container);
        target.container.insertBefore(tagNode, target.child as SsrNode);
        return tagNode;
      } else {
        const tagNode = SsrTagNode.fromTemplate(tag, target);
        target.childNodes.push(tagNode);
        return tagNode;
      }
    },
  };

  try {
    const ssrNode = SsrTagNode.fromTemplate(templateNode);
    await execute(contentOps, [{}], domFactory, ssrNode);
    // const container = new SsrTagNode(null, ':root', new SsrClassList([]));
    // const ssrEvents: SsrEvent[] = [];

    // listen(container, )

    ssrNode['data-hk'] = hydrationKey;

    serializeNode(ssrNode, res);

    res.write(
      `<script>
        const events = ${hibernateObject(this.events)};
        const hydrationRoot = document.querySelector('[data-hk="${hydrationKey}"]');
        console.log(hydrationRoot);
        `
    );
    serializeEvents(this.events, res);
    res.write(`</script>`);
  } catch (err) {
    console.error(err);
  }

  //   serializeNode(templateNode, write);

  // if (contentOps.length) {
  //   serializeNode(templateNode, write, hydrationKey);
  //   write(`<script type="module">`);
  //   write(`import * as mod from "~/pages/client";`);
  //   write(serializeObject(contentOps));
  //   write(`</script>`);
  // } else {
  //   serializeNode(templateNode, write);
  // }
}

type SsrNode = SsrTagNode | SsrTextNode | SsrAnchorNode;

class SsrAnchorNode {
  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public label: string
  ) {}
}
class SsrTextNode {
  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public data: string
  ) {}
}

class SsrTagNode {
  public childNodes: SsrNode[] = [];
  public events: SsrEvent[] = [];

  get firstChild(): SsrNode | undefined | null {
    const { childNodes } = this;
    if (childNodes.length) return childNodes[0];
    return null;
  }

  get nextSibling(): SsrNode | undefined | null {
    const { parentElement } = this;
    if (!parentElement) return null;
    const { childNodes } = parentElement;
    const idx = childNodes.indexOf(this) + 1;
    if (idx < childNodes.length) return childNodes[idx];
    return null;
  }

  set textContent(value: string) {
    this.childNodes[0] = new SsrTextNode(this, value);
    this.childNodes.length = 1;
  }

  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public __name: string,
    public classList: SsrClassList
  ) {}

  insertBefore(node: SsrTagNode, child: SsrNode | null) {
    if (!child) return;
    const idx = this.childNodes.indexOf(child);
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, node);
    }
  }
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions | undefined
  ) {
    if (callback) {
      const { __src, __name, __args } = callback as any;
      if (__src && __name) {
        this.events.push({ type, src: __src, name: __name, args: __args });
      }
    }
  }
  // removeEventListener(
  //   type: string,
  //   callback: EventListenerOrEventListenerObject | null,
  //   options?: boolean | EventListenerOptions | undefined
  // ) {}

  static fromTemplate(template: TagTemplateNode, parent?: SsrTagNode) {
    const root = Object.assign(
      new SsrTagNode(
        parent,
        template.name,
        new SsrClassList(template.classList.slice(0))
      ),
      template.attrs
    );

    const stack: [SsrTagNode, TemplateNode[]][] = [[root, template.childNodes]];
    while (stack.length) {
      const [tag, children] = stack.pop()!;

      for (const child of children) {
        if (child.type === TemplateNodeType.Text) {
          tag.childNodes.push(new SsrTextNode(tag, child.data));
        } else if (child.type === TemplateNodeType.Tag) {
          const childTag = Object.assign(
            new SsrTagNode(
              tag,
              child.name,
              new SsrClassList(child.classList.slice(0))
            ),
            child.attrs
          );

          tag.childNodes.push(childTag);
          stack.push([childTag, child.childNodes]);
        } else if (child.type === TemplateNodeType.Anchor) {
          tag.childNodes.push(new SsrAnchorNode(tag, child.label));
        }
      }
    }
    return root;
  }
}

class SsrClassList {
  constructor(public values: string[]) {}

  public add(value: string) {
    this.values.push(value);
  }
}

const defaultTagKeys = Object.keys(
  new SsrTagNode(null, '', new SsrClassList([]))
);

export function serializeNode(
  node: SsrTagNode,
  res: ResponseWriter,
  hydrationKey?: string
) {
  res.write(`<${node.__name}`);
  const classList = node.classList.values;
  if (classList.length) {
    res.write(` class="${classList.join(' ')}"`);
  }

  if (hydrationKey) {
    res.write(` data-hk="${hydrationKey}"`);
  }

  for (const attrName in node) {
    if (!defaultTagKeys.includes(attrName)) {
      const attrValue = (node as any)[attrName];
      if (attrName === 'checked') {
        if (attrValue) {
          res.write(` ${attrName}`);
        }
      } else {
        res.write(` ${attrName}="${attrValue}"`);
      }
    }
  }

  if (node.childNodes.length || node.__name === 'script') {
    res.write(' >');
    for (const child of node.childNodes) {
      if (child instanceof SsrTagNode) {
        serializeNode(child, res);
      } else if (child instanceof SsrTextNode) {
        res.write(child.data);
      } else if (child instanceof SsrAnchorNode) {
        res.write(`<!--${child.label}-->`);
      }
    }
    res.write(`</${node.__name}>`);
  } else {
    res.write(' />');
  }
}

export function hibernateObject(obj: any) {
  let retval = '(function(__refs = {}){return ';

  const refMap = new RefMap();

  const stack = [obj];
  while (stack.length) {
    const curr = stack.pop();

    if (refMap.hasRef(curr)) {
      retval += `__refs[${refMap.getRef(curr)}]`;
      continue;
    }

    if (curr instanceof Literal) {
      retval += curr.value;
    } else if (curr === null) {
      retval += 'null';
    } else if (curr === undefined) {
      retval += 'undefined';
    } else if (curr instanceof Date) {
      retval += `new Date(${curr.getTime()})`;
    } else if (typeof curr === 'string') {
      retval += `"${curr.replace(/"/g, '\\"')}"`;
    } else if (primitives.includes(typeof curr)) {
      retval += curr;
    } else if (typeof curr === 'symbol') {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=Symbol("${curr.description}")`;
    } else if (curr instanceof Array) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=[`;
      stack.push(new Literal(']'));
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(new Literal(','));
        stack.push(curr[i]);
      }
    } else if (isSerializable(curr)) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=`;
      stack.push(curr.ssr());
      // } else if (curr instanceof Call) {
      //   const func = curr.func;
      //   retval += `mod.${func.name}(`;
      //   stack.push(new Literal(')'));
      //   for (let len = curr.args.length, i = len - 1; i >= 0; i--) {
      //     stack.push(new Literal(','));
      //     stack.push(curr.args[i]);
      //   }
    } else if (curr instanceof Function) {
      const { __src, __name, __args } = curr as {
        __src: string;
        __name: string;
        __args: any;
      };

      const prefix = 'file:///C:/dev/xania-examples';

      if (__src && __src.startsWith(prefix))
        stack.push({ __src: __src.slice(prefix.length), __name, __args });
      else {
        retval += 'undefined';
      }
    } else if (curr.constructor !== Object) {
      const ref = refMap.addRef(curr);

      retval += `(__refs[${ref}]={__proto:"${curr.constructor.name}",`;
      stack.push(new Literal(`},__refs[${ref}])`));
      for (const k in curr) {
        const prop = curr[k];
        if (!(prop instanceof Function)) {
          stack.push(new Literal(','), prop, new Literal(`"${k}":`));
        }
      }
    } else {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]={`;
      stack.push(new Literal('}'));
      for (const k in curr) {
        const prop = curr[k];
        if (prop !== undefined)
          stack.push(new Literal(','), prop, new Literal(`"${k}":`));
      }
    }
  }

  retval += '})({})';
  return retval;
}

class RefMap {
  ref: number = 0;
  map = new Map<any, number>();

  hasRef(o: any) {
    return this.map.has(o);
  }

  getRef(o: any) {
    return this.map.get(o);
  }

  addRef(o: any) {
    const ref = ++this.ref;
    this.map.set(o, ref);
    return ref;
  }
}

interface Serializable {
  ssr(): string;
}

function isSerializable(obj: any): obj is Serializable {
  return obj && obj.ssr instanceof Function;
}

export class Literal {
  constructor(public value: string) {}
}

function serializeEvents(events: JsxEvent[], res: ResponseWriter) {
  res.write('const elt = hydrationRoot');
  for (const ev of events) {
    for (const op of ev.nav) {
      switch (op.type) {
        case DomOperationType.PushChild:
          res.write(`.firstChild`);
          for (let i = 0; i < op.index; i++) {
            res.write(`.nextSibling`);
          }
          break;
        case DomOperationType.PushNextSibling:
          res.write(`.nextSibling`);
          for (let i = 1; i < op.offset; i++) {
            res.write(`.nextSibling`);
          }
          break;
        default:
          // res.write(
          //   `console.log("nav type not supported: ${
          //     DomOperationType[op.type]
          //   }");\n`
          // );
          break;
      }
    }
    res.write(';\n');

    const { __src, __name } = ev.handler as any;
    const prefix = 'file:///C:/dev/xania-examples';

    if (__src && __src.startsWith(prefix)) {
      const source = __src.slice(prefix.length);
      res.write(
        `elt.addEventListener("${ev.name}", function(evt) { 
          import("${source}").then(mod => mod.${__name}(evt))
        });\n`
      );
    }
  }
}
// export class Call {
//   constructor(public func: Function, public args: any[]) {}
// }
