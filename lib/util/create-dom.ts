export function createDOMElement(namespaceURI: string | null, name: string) {
  return document.createElementNS(
    name === 'svg' ? 'http://www.w3.org/2000/svg' : namespaceURI,
    name
  );
}
