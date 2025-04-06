export interface Automaton {
  up(): void;
  appendElement(child: any): any[] | void; // -> children
  appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater;
}

export type TextNodeUpdater = (nodeValue: any) => void;
export interface ITextNode {
  nodeValue: any;
}
