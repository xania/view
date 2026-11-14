import { Instruction, Program } from './program';
import { ArrayFragment } from './sandbox';
import { Scope, State } from './state';

export enum AutomatonTargetEnum {
  Array = 'array',
  Object = 'object',
  Other = 'other',
}

export type AutomatonTarget =
  | AutomatonArrayTarget
  | AutomatonObjectTarget
  | {
      output:
        | AutomatonProperty
        | AutomatonRegion
        | AutomatonTemplate
        | AutomatonOutput;
      traversal: Program;
      patches?: Map<State, Instruction[]>;
      events?: Map<Event, Instruction[]>;
      init?: Instruction[];
      scope: Scope;
      type: AutomatonTargetEnum.Other;
    };

export type AutomatonObjectTarget = {
  object: AutomatonObject;
  traversal: Program;
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
  type: AutomatonTargetEnum.Object;
};

export type AutomatonArrayTarget = {
  array: any[];
  offset: number;
  traversal: Program;
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
  type: AutomatonTargetEnum.Array;
};

type RegionFrame = Record<symbol, any> & { key: string };

export type ITemplate = {
  push(scope: Scope, item: any): void;
  clone(output: any[], visible?: boolean): void;
};

export type AutomatonOutput = {
  update?: (idx: number | string, value: any) => void;
  [key: string | number | symbol]: any;
};

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

export class AutomatonProperty {
  constructor(
    public object: AutomatonObject,
    public prop: string | number | symbol
  ) {}
}

export type AutomatonObject = Record<string | number | symbol, any>;

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

export function clone(template: any[], output: any[]): void {
  for (const item of template) {
    output.push(cloneTemplateItem(item));
  }
}
