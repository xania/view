import { Instruction, Program } from './program';
import { ArrayFragment } from './sandbox';
import { Lense, Scope, State } from './state';
import { Event } from './event';

export type AutomatonOutput =
  | {
      update?: (idx: number | string, value: any) => void;
      [key: string | number | symbol]: any;
    }
  | Record<string | number | symbol, any>
  | any[];
export type AutomatonTarget = {
  output:
    | AutomatonObject
    | AutomatonRegion
    | AutomatonTemplate
    | AutomatonOutput;
  traversal: Program;
  // root (updatable) state -> updates instructions
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
};

export interface Automaton {
  currentTarget: AutomatonTarget;
  appendArray(): AutomatonTarget | void;
  appendObject(type?: string): AutomatonTarget;
  appendText(content: ITextNode['nodeValue']): void;
  appendValue<T>(stateValue?: T): Program | void;
  pushConditional(lense: Lense<any>, stateValue: any): AutomatonTarget;
  pushRegion(visible?: boolean | void): AutomatonTarget;
  pushTemplate(): AutomatonTarget;
}

type RegionFrame = Record<symbol, any> & { key: string };

export class AutomatonTemplate implements ITemplate {
  public items: any[] = [];
  public readonly regions: RegionFrame[] = [];
  public patches: Map<State, Instruction[]> = new Map();
  public init: Instruction[] = [];

  constructor(
    public scope: Scope,
    public offset: number,
    public itemKey?: symbol
  ) {}

  push(item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);

    return idx;
  }

  update(idx: number, item: any) {
    this.items[idx] = item;
  }

  createRegion(value: any): RegionFrame {
    const region: RegionFrame = {
      key: value,
    };

    if (this.itemKey) {
      region[this.itemKey] = value;
    }

    return region;
  }

  clone(output: any[], key: any) {
    const offset = output.length;
    const region = this.createRegion(key);
    this.regions.push(region);

    clone(this.items, output);

    return region;
  }

  insert(output: any[] | ArrayFragment, value: any, index: number): void {
    const { offset } = this;
    const region = this.createRegion(value);
    this.regions.splice(index, 0, region);

    if (output instanceof Array) {
      output.splice(index + offset, 0, ...this.items.map(cloneTemplateItem));
    } else if (output instanceof ArrayFragment) {
      output.output.splice(
        index + output.offset + offset,
        0,
        ...this.items.map(cloneTemplateItem)
      );
    }
  }
}

export class AutomatonRegion {
  public readonly offset: number;
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

export class AutomatonConditional {
  public readonly offset: number;
  public items: any[] = [];

  constructor(
    public output: any[],
    _state: any,
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

  fragment = () => {
    if (this.visible) return new ArrayFragment(this.output, this.offset);
    else return this.items;
  };

  show(visible: boolean) {
    if (this.visible === visible) return;

    this.visible = visible;

    if (visible) {
      this.output.splice(this.offset, 0, ...this.items);
    } else {
      this.items = this.output.splice(this.offset, this.items.length);
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

  clone() {
    clone(this.items, this.output);
  }
}

export class AutomatonObject {
  public prop?: string;

  constructor(public object: Record<string | number | symbol, any>) {}
}

export function cloneTemplateItem<T>(item: T): T {
  if (item instanceof Array) {
    return item.map(cloneTemplateItem) as T;
  }

  if (item && item.constructor === Object) {
    const clone: Record<string | number | symbol, any> = {};
    for (const key of Reflect.ownKeys(item)) {
      clone[key] = cloneTemplateItem(
        (item as Record<string | number | symbol, any>)[key]
      );
    }
    return clone as T;
  }

  return item;
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

export type ITemplate = {
  push(scope: Scope, item: any): void;
  clone(output: any[], visible?: boolean): void;
};

export function clone(template: any[], output: any[]): void {
  for (const item of template) {
    output.push(cloneTemplateItem(item));
  }
}
