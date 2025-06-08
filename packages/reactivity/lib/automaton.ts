export interface Automaton {
  up(): void;
  appendArray(property?: string): void;
  appendObject(property?: string): void;
  appendElement(child: any, property?: string): Array<any> | Record<any, any>; // -> children
  appendText(
    content?: ITextNode['nodeValue'],
    property?: string
  ): ITextNode | TextNodeUpdater;
  startRegion(visible: boolean): IRegion;
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

export interface IRegion {
  visible: boolean;
  show(): void;
  hide(): void;
}
