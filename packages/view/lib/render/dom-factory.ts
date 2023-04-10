export interface DomFactory {
  createElementNS: Document['createElementNS'];
  createTextNode(value: string): Text;
  createComment: Document['createComment'];
}
