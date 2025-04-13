export interface Automaton {
  up(): void;
  appendElement(child: any): SetProperty[] | void; // -> children
  appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater;
}

export type TextNodeUpdater = (nodeValue: any) => void;
export interface ITextNode {
  nodeValue: any;
}

export class SetProperty {
  constructor(
    public name: string,
    public value: any
  ) {}
}

export const popScope = Symbol();
