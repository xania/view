import { RenderTarget } from '../jsx';

export interface EventsProps {
  [name: string]: Function;
}
export function Events(props: EventsProps) {
  return {
    render(target: RenderTarget) {
      if (target.setAttribute instanceof Function) {
        for (let name in props) {
          const value = props[name];
          target.addEventListener(name, value as any);
        }
      }
    },
  };
}