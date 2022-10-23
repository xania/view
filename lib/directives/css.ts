import { RenderTarget } from 'lib/jsx';

export interface CssProps {
  value: string[];
}

export function Css(props: CssProps) {
  return {
    render(target: RenderTarget) {
      const { value } = props;
      const classList = (target as HTMLElement).classList;
      for (const cl of value) {
        if (!classList.contains(cl)) classList.add(cl);
      }
      return {
        dispose() {
          for (const cl of value) {
            if (classList.contains(cl)) classList.remove(cl);
          }
        },
      };
    },
  };
}
