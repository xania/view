import { Anchor, DomContentOperation, JsxElement, RenderTarget } from '../jsx';
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
import {
  RefMap,
  hibernateObject,
  ImportMap,
} from '../../../resumable/lib/hibernate';

type SsrEvent = { type: string; src: string; name: string; args: any[] };

type ModuleClosure = {
  __src: string;
  __name: string;
  __args?: any[];
};

interface ResponseWriter {
  write(str: string): void;
}
export async function hibernateJsx(this: JsxElement, res: ResponseWriter) {
  const hydrationKey = 'hk-1'; // TODO content based key

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
      `<script type="module">
        import { hydrate as __hydrate } from "@xania/resumable/lib/hydrate.ts";

        const hydrationRoot = document.querySelector('[data-hk="${hydrationKey}"]');
        var cIter = document.createNodeIterator(
          document.body,
          NodeFilter.SHOW_COMMENT
        );
        while(cIter.nextNode()){
          if(cIter.referenceNode.data === 'separator')
          cIter.referenceNode.remove();
        }
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

let __uid: number = 1;

type SsrNode = SsrTagNode | SsrTextNode | SsrAnchorNode;

function ssr(this: SsrNode) {
  let node: SsrNode | undefined | null = this;
  const path: number[] = [];
  while (node) {
    const parentElement: SsrTagNode | null | undefined = node.parentElement;
    if (!parentElement) {
      break;
    }

    const idx = parentElement.childNodes.indexOf(node);
    path.push(idx);

    node = parentElement;
  }

  return { __node: path.reverse() };
}

class SsrAnchorNode {
  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public label: string
  ) {}

  ssr = ssr;
}
class SsrTextNode {
  public id = __uid++;
  constructor(
    public parentElement: SsrTagNode | undefined | null,
    public textContent: string
  ) {}

  get nextSibling(): SsrNode | undefined | null {
    const { parentElement } = this;
    if (!parentElement) return null;
    const { childNodes } = parentElement;
    const idx = childNodes.indexOf(this) + 1;
    if (idx < childNodes.length) return childNodes[idx];
    return null;
  }

  ssr = ssr;
}

class SsrTagNode {
  public id = __uid++;
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

  ssr = ssr;
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
        res.write(child.textContent);
        if (child.nextSibling instanceof SsrTextNode)
          res.write('<!--separator-->');
      } else if (child instanceof SsrAnchorNode) {
        res.write(`<!--${child.label}-->`);
      }
    }
    res.write(`</${node.__name}>`);
  } else {
    res.write(' />');
  }
}

function serializeEvents(events: JsxEvent[], res: ResponseWriter) {
  const refMap = new RefMap();
  const importMap = new ImportMap();
  res.write(`const __refs = {};\n`);
  res.write(`const __cache = {};\n`);
  res.write(hibernateObject(events, refMap, importMap));
  res.write(`;\n`);

  for (const [loader, source] of importMap.entries) {
    res.write(`function ${loader}(){ return import("${source}") }\n`);
  }

  for (const ev of events) {
    const { __src, __name, __args } = ev.handler as unknown as ModuleClosure;
    const prefix = 'file:///C:/dev/xania-examples';

    if (__src && __src.startsWith(prefix)) {
      const source = __src.slice(prefix.length);

      res.write(
        `hydrationRoot.addEventListener("${ev.name}", function(evt) { `
      );

      res.write(`const elt = hydrationRoot`);

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

      if (__args instanceof Array) {
        const ref = refMap.getRef(__args);
        res.write(`

        (__cache[${ref}] ?? (__cache[${ref}] = __hydrate(__refs[${ref}], hydrationRoot))).then(args => {
          import("${source}").then(mod => {
            const handler = mod.${__name}.apply(null, args);
            handler(evt)
          });  
        });
        
        `);
      } else {
        res.write(`import("${source}").then(mod => mod.${__name}(evt));`);
      }
      res.write(` });`);
    }
  }
}
// export class Call {
//   constructor(public func: Function, public args: any[]) {}
// }
