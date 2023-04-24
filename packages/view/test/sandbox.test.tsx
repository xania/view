import { describe, it } from 'vitest';
import { Sandbox } from '../reactivity';
import { renderStack } from '../lib/render/browser/render-stack';
import { DomFactory } from '../lib';


class Factory implements DomFactory {
  createComment (data: string) {
    return null as Comment
  }
  createElementNS: { (namespaceURI: 'http://www.w3.org/1999/xhtml', qualifiedName: string): HTMLElement; <K extends keyof SVGElementTagNameMap>(namespaceURI: 'http://www.w3.org/2000/svg', qualifiedName: K): SVGElementTagNameMap[K]; (namespaceURI: 'http://www.w3.org/2000/svg', qualifiedName: string): SVGElement; <K extends keyof MathMLElementTagNameMap>(namespaceURI: 'http://www.w3.org/1998/Math/MathML', qualifiedName: K): MathMLElementTagNameMap[K]; (namespaceURI: 'http://www.w3.org/1998/Math/MathML', qualifiedName: string): MathMLElement; (namespaceURI: string | null, qualifiedName: string, options?: ElementCreationOptions | undefined): Element; (namespace: string | null, qualifiedName: string, options?: string | ... 1 more ... | undefined): Element; };
  createTextNode(value: string): Text {
      
  }
};


describe('sandbox', () => {
  it('view', () => {
    const element = {} as Element;

    const sandbox = new Sandbox(element);
    const template = <div>xania</div>;

    renderStack([[sandbox, element, template, true]], factory);
    console.log(template);
  });
});


