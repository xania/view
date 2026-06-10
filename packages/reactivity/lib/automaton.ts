import { Instruction } from './program';
import { Lense, Scope, State, Value } from './state';

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
    | AutomatonTemplate
    | AutomatonOutput;
  traversal: Instruction[];
  events?: Record<string | symbol, Instruction[]>;
};

export class AutomatonTemplate implements ITemplate {
  public items: any[] = [];
  public readonly regions: number[] = [];

  constructor(
    public output: any[],
    public scope: Scope
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

  clone(): void {
    const offset = this.output.length;
    this.regions.push(offset);

    clone(this.items, this.output);
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
    public state: Lense<boolean>,
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

  show(visible: boolean) {
    if (this.visible === visible) return;

    this.visible = visible;

    if (visible) {
      this.output.splice(this.offset, 0, ...this.items);
    } else {
      this.output.splice(this.offset, this.items.length);
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

export class ObjectProperty {
  constructor(
    public object: any,
    public prop?: string
  ) {}
}

function cloneTemplateItem<T>(item: T): T {
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
  offset: number;
  push(item: any): void;
  show(visible: boolean): void;
  update(idx: number, value: any): void;
};

export type ITemplate = {
  push(scope: Scope, item: any): void;
  clone(visible?: boolean): void;
};

export function clone(template: any[], output: any[]): void {
  for (const item of template) {
    output.push(cloneTemplateItem(item));
  }
}
