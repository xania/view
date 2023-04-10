import { DomDescriptor, DomDescriptorType } from './descriptors';

export function intrinsic(
  name: string,
  props: { children?: JSX.Element; [attr: string]: any }
) {
  const template: DomDescriptor = {
    name,
    type: DomDescriptorType.Element,
  };

  if (props) {
    const { children, ...attrs } = props;

    if (children) {
      template.children = children;
    }

    if (attrs) {
      template.attrs = attrs;
    }
  }

  return template;
}

export * from './descriptors';
