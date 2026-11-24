import { Instruction, Program } from './program';
import { ArrayFragment } from './sandbox';
import { Scope, State } from './state';

export enum AutomatonTargetEnum {
  Array = 'array',
  Object = 'object',
  Conditional = 'conditional',
}

export type AutomatonTarget =
  | AutomatonArrayTarget
  | AutomatonObjectTarget
  | AutomatonConditionalTarget;

export class ConditionalOutput {
  public offline: any[] = [];
  constructor(
    public parent: AutomatonTarget,
    public visible: boolean | undefined
  ) {}

  push(value: any): number {
    const { offline, parent } = this;
    const idx = offline.length;

    offline.push(value);

    if (this.visible) {
      switch (parent.type) {
        case AutomatonTargetEnum.Array:
          parent.output.push(value);
          break;
        case AutomatonTargetEnum.Conditional:
          parent.output.push(value);
          break;
        case AutomatonTargetEnum.Object:
          throw Error('Object target is not supported');
        default:
          throw Error('Target unknown');
      }
    }

    return idx;
  }
}
export type AutomatonConditionalTarget = {
  traversal: [];
  output: ConditionalOutput;
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
  type: AutomatonTargetEnum.Conditional;
};

export type AutomatonArrayTarget = {
  output: any[];
  offset?: number;
  traversal: Program;
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
  type: AutomatonTargetEnum.Array;
};

export type AutomatonObjectTarget = {
  output: AutomatonObject;
  prop?: string | number | symbol;
  traversal: Program;
  patches?: Map<State, Instruction[]>;
  events?: Map<Event, Instruction[]>;
  init?: Instruction[];
  scope: Scope;
  type: AutomatonTargetEnum.Object;
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
  public patches?: Map<State, Instruction[]>;
  public init?: Instruction[];
  public itemKey?: symbol;

  constructor(
    public readonly scope: Scope,
    public readonly offset: number
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

export type AutomatonObject = Record<string | number | symbol, any>;

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
