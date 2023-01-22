import { JsxElement, RenderContainer } from '../jsx';
import { TagTemplateNode, TemplateNodeType } from '../jsx/template-node';
import { execute } from '../render';

const primitives = ['number', 'bigint', 'boolean'];

export function hibernateJsx(this: JsxElement, write: (s: string) => void) {
  const hydrationKey = new Date().getTime().toString();
  const { contentOps, templateNode } = this;

  try {
    execute(contentOps, [{}], new TagNode(templateNode) as any);
  } catch (err) {
    console.log(err);
  }

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

function createHtmlElement(tag: TagTemplateNode) {
  return new TagNode(tag) as any;
}

class TagNode {
  constructor(public template: TagTemplateNode) {}
}

export function serializeNode(
  node: TagTemplateNode,
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
      switch (child.type) {
        case TemplateNodeType.Tag:
          serializeNode(child, write);
          break;
        case TemplateNodeType.Text:
          write(child.data);
          break;
        case TemplateNodeType.Anchor:
          write(`<!--${child.label}-->`);
          break;
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
