import { AttributeType, Template, TemplateType } from '.';

export interface CssModuleProps {
  classes: { [key: string]: string };
}

export function CssModule(props: CssModuleProps, children: Template[]) {
  const stack: Template[] = children.filter((x) => !!x);
  const { classes } = props;
  if (classes) {
    while (stack.length) {
      const template = stack.pop() as Template;
      switch (template.type) {
        case TemplateType.Tag:
          const { attrs, children } = template;
          if (attrs) {
            for (const attr of attrs) {
              if (
                attr.type === AttributeType.Attribute &&
                (attr.name === 'class' || attr.name === 'className')
              ) {
                const mapped = classes[attr.value];
                if (mapped) attr.value = mapped;
              }
            }
          }
          if (Array.isArray(children)) {
            for (const child of children) {
              stack.push(child);
            }
          }

          break;
      }
    }
  }

  return children;
}
