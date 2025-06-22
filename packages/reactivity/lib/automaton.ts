export interface Automaton {
  up(): void;
  appendArray(property?: string): void;
  appendObject(property?: string): void;
  appendElement(child: any, property?: string): Array<any> | Record<any, any>; // -> children
  appendText(
    content?: ITextNode['nodeValue'],
    property?: string
  ): ITextNode | TextNodeUpdater;
  pushRegion(visible: boolean, property?: string): IRegion;
  pushTemplate(property?: string): ITemplate;
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

export type IRegion = {
  show(visible: boolean): void;
};

export type ITemplate = {
  clone(): void;
};
