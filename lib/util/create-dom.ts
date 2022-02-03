export function createDOMElement(name: string) {
  return document.createElementNS(
    name === 'svg'
      ? 'http://www.w3.org/2000/svg'
      : 'http://www.w3.org/1999/xhtml',
    name
  );
}

export function createHtmlElement<K extends keyof HTMLElementTagNameMap>(
  name: K
) {
  return document.createElement(name) as HTMLElementTagNameMap[K];
}
