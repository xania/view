import { Program } from './program';
import { Lense } from './state';
import { AutomatonTarget } from './target';

export interface Automaton {
  currentTarget: AutomatonTarget;
  appendArray(): AutomatonTarget | void;
  appendObject(type?: string): AutomatonTarget;
  appendText(content: ITextNode['nodeValue']): void;
  appendValue<T>(stateValue?: T): Program | void;
  pushConditional(lense: Lense<any>, stateValue: any): AutomatonTarget;
  pushRegion(visible?: boolean | void): AutomatonTarget;
  pushTemplate(): AutomatonTarget;
  pushChildren(): AutomatonTarget;
  pushProperty(prop: string): AutomatonTarget;
}

export class AutomatonConditional {
  public readonly offset: number;
  private readonly items: any[] = [];

  constructor(
    public output: any[],
    public visible: boolean | void
  ) {
    if (this.output instanceof Array) {
      this.offset = this.output.length;
    } else {
      throw Error(
        'invalid state: expected array scope but got object {' +
          this.output +
          '}'
      );
    }
  }

  push(item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);
    if (this.visible) {
      this.output.push(item);
    }
    return idx;
  }
}

export interface ITextNode {
  nodeValue: any;
}

export const popScope = Symbol();
export type IRegion = {
  offset: number;
  push(item: any): void;
  show(visible: boolean): void;
  update(idx: number, value: any): void;
};
