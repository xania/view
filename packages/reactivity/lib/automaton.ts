import { Instruction, TraversalInstruction } from './program';
import { Scope, State, Value } from './state';

export type Updatable =
  | {
      update?: (idx: number | string, value: any) => void;
      [key: string]: any;
    }
  | Record<string | number, any>;

export type AutomatonOutput =
  | {
      update?: (idx: number | string, value: any) => void;
      [key: string]: any;
    }
  | Record<string | number, any>
  | any[];
export type AutomatonTarget = {
  output:
    | ObjectProperty
    | AutomatonRegion
    | AutomatonNode
    | AutomatonTemplate
    | AutomatonOutput;
  traversal: TraversalInstruction[];
  events?: Record<string | symbol, Instruction[]>;
};

export class AutomatonTemplate implements ITemplate {
  private items: any[] = [];
  public regions: IRegion[] = [];
  constructor(
    public automaton: {
      pushRegion(visible: State<boolean> | Value<boolean>): IRegion;
    },
    public scope: Scope
  ) {}

  push(item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);

    return idx;
  }

  clone(): IRegion {
    var newRegion = this.automaton.pushRegion();

    for (const item of this.items) {
      newRegion.push(item);
    }

    this.regions.push(newRegion);

    return newRegion;
  }
}

export class AutomatonRegion {
  private offset: number;
  private items: any[] = [];

  constructor(
    public output: AutomatonOutput,
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

  update(idx: number, item: any) {
    this.items[idx] = item;

    if (this.visible) {
      if (this.output instanceof Array) {
        this.output[this.offset + idx] = item;
      } else {
        throw Error('invalid state: expected array scope');
      }
    }
  }

  show(visible: boolean) {
    if (this.visible === visible) {
      return;
    }

    this.visible = visible;

    if (visible) {
      this.output.splice(this.offset, 0, ...this.items);
    } else {
      this.output.splice(this.offset, this.items.length);
    }
  }
  clone() {
    const self = this;

    this.output.push(...self.items);
  }
}

export class AutomatonNode {
  private currentValue?: any;

  constructor(
    public parent: any[],
    public visible: boolean = true,
    public index = parent.length
  ) {}

  push(value: any) {
    this.currentValue = value;

    const { parent, index } = this;

    if (index !== parent.length) {
      throw Error('Race condition');
    }

    const nodeValue = this.visible ? value : undefined;

    parent.push(nodeValue);
  }

  show(visible: boolean) {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;

    const { parent, index } = this;
    if (visible) {
      parent[index] = this.currentValue;
    } else {
      parent[index] = undefined;
    }
  }

  update(_: number, newValue: any) {
    const { currentValue } = this;

    if (currentValue === newValue) {
      return;
    }

    this.currentValue = newValue;

    const { parent, index } = this;
    if (this.visible) {
      parent[index] = newValue;
    } else {
      parent[index] = undefined;
    }
  }
}

export class ObjectProperty {
  constructor(
    public object: any,
    public prop?: string
  ) {}
}

// export interface Automaton {
//   currentTarget: AutomatonTarget;
//   events: Record<symbol, Program>;
//   popTarget(): void;
//   appendObject(): void;
//   selectProperty(prop: string): void;
//   appendArray(): void;
//   appendValue(
//     state: State<any>,
//     content?: string | number | undefined
//   ): Program | undefined;
//   appendText(content?: ITextNode['nodeValue']): ITextNode | TextNodeUpdater;
//   appendNode(visible: boolean): INode;
//   pushRegion(visible: boolean): IRegion;
//   pushTemplate(state: State<any>): ITemplate;
// }

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

export type INode = {
  push(item: any): void;
  show(visible: boolean): void;
};
export type IRegion = {
  push(item: any): void;
  show(visible: boolean): void;
  update(idx: number, value: any): void;
};

export type ITemplate = {
  push(scope: Scope, item: any): void;
  clone(visible?: boolean): IRegion;
};
