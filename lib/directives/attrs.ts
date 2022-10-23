import { RenderTarget } from 'lib/jsx';

export interface AttrsProps {
  [name: string]: string;
}
export function Attrs(props: AttrsProps) {
  return {
    render(target: RenderTarget) {
      if (target.setAttribute instanceof Function) {
        for (let name in props) {
          const value = props[name];
          target.setAttribute(name, value);
        }
      }
    },
  };
}
