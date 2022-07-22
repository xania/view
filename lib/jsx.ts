import { TagTemplate, Template, TemplateType } from './template';
import { reverse } from './util/reverse';
import { AttributeType } from './template';
import { isUnsubscribable } from './util/is-subscibable';
import { Renderable } from './renderable';
import { State } from './state';

export const jsx = {
  createElement(
    name: string | Function | null,
    props: any = null,
    ...children: unknown[]
  ): Template | null {
    if (name === null /* fragment */) {
      return {
        type: TemplateType.Fragment,
        children: flatTree(children, asTemplate),
      };
    }

    if (typeof name === 'string') {
      const attrs = attributes(props);
      return {
        type: TemplateType.Tag,
        name,
        attrs,
        children: flatTree(children, asTemplate),
      };
    }

    if (typeof name === 'function') {
      try {
        return name(props, children);
      } catch (e) {
        return Reflect.construct(name, [props, children]);
      }
    }

    return null;
  },

  createFragment(_: null, children: Template[]): Template {
    return {
      type: TemplateType.Fragment,
      children,
    };
  },
};

function flatTree<T = any>(tree: any, project?: (item: any) => T | T[]) {
  var retval: T[] = [];
  var stack = [tree];
  while (stack.length > 0) {
    var curr = stack.pop();
    if (Array.isArray(curr)) {
      stack.push.apply(stack, reverse(curr));
    } else if (curr !== null && curr !== undefined) {
      const projected = project ? project(curr) : curr;
      if (Array.isArray(projected)) {
        retval.push.apply(retval, projected);
      } else if (projected !== undefined && projected !== null) {
        retval.push(projected);
      }
    }
  }
  return retval;
}

// function hasProperty<P extends string>(
//   obj: any,
//   prop: P
// ): obj is { [K in P]: any } {
//   return typeof obj === 'object' && obj !== null && prop in obj;
// }

function attributes(props: any | null): TagTemplate['attrs'] {
  if (props)
    return Object.keys(props).map((name) => {
      const value = props[name];
      if (('on' + name).toLocaleLowerCase() in HTMLElement.prototype) {
        return {
          type: AttributeType.Event,
          event: name.toLocaleLowerCase(),
          handler: value,
        };
      } else {
        return {
          type: AttributeType.Attribute,
          name,
          value,
        };
      }
    });
  return null;
}

export function asTemplate(value: any): Template {
  if (typeof value === 'undefined' || value === null) {
    return null as any;
  } else if (isTemplate(value)) return value;
  // else if (isComponent(name)) return new TemplateComponent(name);
  // else if (isAttachable(name)) return new TemplateAttachable(name);
  // else if (typeof name === 'function') return name;
  // else if (Array.isArray(name)) return flatTree(name, asTemplate);
  // else if (isPromise<TemplateInput>(name)) return new TemplatePromise(name);
  else if (value instanceof State) {
    return {
      type: TemplateType.State,
      state: value,
    };
  } else if (isUnsubscribable(value))
    return {
      type: TemplateType.Disposable,
      dispose() {
        value.unsubscribe();
      },
    };
  else if (isDomNode(value))
    return {
      type: TemplateType.DOM,
      node: value,
    };
  else if (
    'view' in Object.keys(value) ||
    'view' in value.constructor.prototype
  ) {
    return {
      type: TemplateType.ViewProvider,
      provider: value,
    };
  } else if (isRenderable(value)) {
    return {
      type: TemplateType.Renderable,
      renderer: value,
    };
  } else if (typeof value === 'function') {
    return {
      type: TemplateType.Renderable,
      renderer: {
        render: value,
      },
    };
  }
  // else if (hasProperty(name, 'view')) return asTemplate(name.view);
  // else if (isPrimitive(name)) return new PrimitiveTemplate(name);

  // return new NativeTemplate(name);
  return {
    type: TemplateType.Text,
    value,
  };
}

// function isComponent(value: any): value is Component {
//   return value && typeof value.view === 'function';
// }

// function isAttachable(value: any): value is Attachable {
//   return value && typeof value.attachTo === 'function';
// }

function isRenderable(value: any): value is Renderable {
  return value && typeof value.render === 'function';
}

// function isPromise<T = unknown>(value: any): value is Promise<T> {
//   return value && typeof value.then === 'function';
// }

function isTemplate(value: any): value is Template {
  if (!value) return false;
  const { type } = value;
  return type === 0 || !isNaN(parseInt(type));
}

// function functionAsTemplate(func: Function): ITemplate {
//   return {
//     render(driver: IDriver, ...args) {
//       const tpl = func(...args);
//       var template = asTemplate(tpl);
//       if (Array.isArray(template)) {
//         const bindings: Binding[] = [];
//         for (let i = 0; i < template.length; i++) {
//           const b = template[i].render(driver);
//           if (b) {
//             bindings.push();
//           }
//         }
//         return {
//           dispose() {
//             for (let i = 0; i < bindings.length; i++) {
//               const binding = bindings[i];
//               if (binding.dispose) {
//                 binding.dispose();
//               }
//             }
//           },
//         };
//       } else {
//         return template.render(driver);
//       }
//     },
//   };
// }

function isDomNode(obj: any): obj is Node {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLElement;
  } catch (e) {
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (
      typeof obj === 'object' &&
      obj.nodeType === 1 &&
      typeof obj.style === 'object' &&
      typeof obj.ownerDocument === 'object'
    );
  }
}

// export function createFunctionRenderer(func: Function): RenderableTemplate {
//   return {
//     type: TemplateType.Renderable,
//     renderer: {
//       render(driver: any, context: RenderContext) {
//         const templates = flatTree(func.apply(null, [context]), asTemplate);
//         return compile(templates).render(driver.target, undefined);
//       },
//     },
//   };
// }
