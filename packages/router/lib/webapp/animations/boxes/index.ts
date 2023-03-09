import classes from './boxes.module.scss';

function div(props?: any, ...children: HTMLElement[]) {
  const tag = document.createElement('div');

  if (props)
    for (const attrName in props) {
      tag.setAttribute(attrName, props[attrName]);
    }

  for (const child of children) {
    tag.appendChild(child);
  }

  return tag;
}

export default function () {
  return div(
    { class: classes['boxes'] },
    div({ class: classes['box'] }, div(), div(), div(), div()),
    div({ class: classes['box'] }, div(), div(), div(), div()),
    div({ class: classes['box'] }, div(), div(), div(), div()),
    div({ class: classes['box'] }, div(), div(), div(), div())
  );
}
