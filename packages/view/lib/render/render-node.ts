import { DomDescriptorType, StaticTemplate } from '../intrinsic/descriptors';
import { DomFactory } from './dom-factory';

// export function applyAttributes(
//   target: HTMLElement,
//   attrs: ElementDescriptor['attrs']
// ) {
//   if (attrs) {
//     for (let i = 0, len = attrs.length; i < len; i++) {
//       const attr = attrs[i];
//       (target as any)[attr.name] = attr.value;
//     }
//   }
// }

// export function applyClassList(
//   target: HTMLElement,
//   classList: ElementDescriptor['classList']
// ) {
//   if (classList) {
//     try {
//       const stack: any[] = [classList];
//       while (stack.length) {
//         const curr = stack.pop()!;
//         if (curr instanceof Array) {
//           stack.push(...curr);
//         } else if (curr?.constructor === String) {
//           for (const item of curr.split(' ')) {
//             const cl = item.trim();
//             if (cl) {
//               target.classList.add(cl);
//             }
//           }
//         }
//       }
//     } catch (err) {
//       debugger;
//     }
//   }
// }

// // export function applyEvents(
// //   events: ElementDescriptor['events'],
// //   target: HTMLElement,
// //   context: RenderContext
// // ) {
// //   if (!events) {
// //     return null;
// //   }

// //   const disposables: Disposable[] = [];
// //   for (const eventName in events) {
// //     const eventHandler = events[eventName];

// //     const syntaticEventHandler = (originalEvent: Event) => {
// //       const messages = isCommand(eventHandler)
// //         ? eventHandler
// //         : eventHandler instanceof Function
// //         ? eventHandler(syntheticEvent(eventName, originalEvent))
// //         : eventHandler.handleEvent(syntheticEvent(eventName, originalEvent));

// //       context.applyCommands(messages);
// //     };

// //     disposables.push(
// //       new Disposable(() => {
// //         target.removeEventListener(eventName, syntaticEventHandler, true);
// //       })
// //     );

// //     target.addEventListener(eventName, syntaticEventHandler, true);
// //   }

// //   return disposables;
// // }

export function syntheticEvent(
  eventName: string,
  domEvent: Event,
  currentTarget = domEvent.currentTarget
) {
  const syntaticEvent: any = {
    event: domEvent as any,
    target: domEvent.target,
    currentTarget: currentTarget,
    type: eventName,
  };
  if ('key' in domEvent) {
    syntaticEvent.key = domEvent.key;
  }

  return syntaticEvent;
}

// export function renderStatic(st: StaticTemplate, domFactory: DomFactory) {
//   switch (st.type) {
//     case DomDescriptorType.StaticElement:
//       const element = domFactory.createElement(st.name);
//       applyAttributes(element, st.attrs);

//       const { children } = st;
//       if (children instanceof Array) {
//         for (const child of children) {
//           element.appendChild(renderStatic(child, domFactory));
//         }
//       } else if (children) {
//         element.appendChild(renderStatic(children, domFactory));
//       }
//       return element;
//     case DomDescriptorType.Data:
//       return domFactory.createTextNode(st.data.toString());
//     case DomDescriptorType.Text:
//       return domFactory.createTextNode(st.text);
//   }
// }
