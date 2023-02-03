import { Anchor, JsxElement, RenderTarget } from '../jsx';
import {
  TagTemplateNode,
  TemplateNode,
  TemplateNodeType,
} from '../jsx/template-node';
import { IDomFactory } from '../render/dom-factory';
import { DomOperation } from '../render/dom-operation';
import { execute } from '../render/execute';

const primitives = ['number', 'bigint', 'boolean'];

export async function hibernateJsx(
  this: JsxElement,
  write: (s: string) => void
) {
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
    serializeNode(ssrNode, write);
  } catch (err) {
    console.log(err);
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

  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public name: string,
    public classList: string[],
    public attrs: Record<string, any>
  ) {}
  insertBefore(node: SsrTagNode, child: SsrNode | null) {
    if (!child) return;
    const idx = this.childNodes.indexOf(child);
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, node);
    }
  }
  // addEventListener(
  //   type: string,
  //   callback: EventListenerOrEventListenerObject | null,
  //   options?: boolean | AddEventListenerOptions | undefined
  // ) {}
  // removeEventListener(
  //   type: string,
  //   callback: EventListenerOrEventListenerObject | null,
  //   options?: boolean | EventListenerOptions | undefined
  // ) {}

  static fromTemplate(template: TagTemplateNode, parent?: SsrTagNode) {
    const root = new SsrTagNode(
      parent,
      template.name,
      template.classList,
      template.attrs
    );

    const stack: [SsrTagNode, TemplateNode[]][] = [[root, template.childNodes]];
    while (stack.length) {
      const [tag, children] = stack.pop()!;

      for (const child of children) {
        if (child.type === TemplateNodeType.Text) {
          tag.childNodes.push(new SsrTextNode(tag, child.data));
        } else if (child.type === TemplateNodeType.Tag) {
          const childTag = new SsrTagNode(
            tag,
            child.name,
            child.classList,
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

export function serializeNode(
  node: SsrTagNode,
  write: (s: string) => void,
  hydrationKey?: string
) {
  write(`<${node.name}`);
  if (node.classList.length) {
    write(` class="${node.classList.join(' ')}"`);
  }

  if (hydrationKey) {
    write(` data-hk="${hydrationKey}"`);
  }
  for (const attrName in node.attrs) {
    write(` ${attrName}="${node.attrs[attrName]}"`);
  }

  if (node.childNodes.length || node.name === 'script') {
    write(' >');
    for (const child of node.childNodes) {
      if (child instanceof SsrTagNode) {
        serializeNode(child, write);
      } else if (child instanceof SsrTextNode) {
        write(child.data);
      } else if (child instanceof SsrAnchorNode) {
        write(`<!--${child.label}-->`);
      }
    }
    write(`</${node.name}>`);
  } else {
    write(' />');
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
    } else if (curr instanceof Call) {
      const func = curr.func;
      retval += `mod.${func.name}(`;
      stack.push(new Literal(')'));
      for (let len = curr.args.length, i = len - 1; i >= 0; i--) {
        stack.push(new Literal(','));
        stack.push(curr.args[i]);
      }
    } else if (curr instanceof Function) {
      retval += `()=>console.log('"${curr.name.replace(/"/g, '\\"')}"')`;
    } else if (curr.constructor !== Object) {
      const ref = refMap.addRef(curr);

      retval += `(Reflect.setPrototypeOf(__refs[${ref}]={`;
      stack.push(
        new Literal(
          `}, mod.${curr.constructor.name}.prototype),__refs[${ref}])`
        )
      );
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

export class Call {
  constructor(public func: Function, public args: any[]) {}
}
