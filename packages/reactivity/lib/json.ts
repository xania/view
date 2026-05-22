import {
  Automaton,
  INode,
  IRegion,
  ITemplate,
  ITextNode,
  TextNodeUpdater,
} from './automaton';
import { RootScope, Scope } from './state';

export enum JsonEnum {
  Object = 99823786,
  String,
  Property,
}

export type JToken = JObject | JString | JArray;

export interface JObject {
  type: JsonEnum.Object;
  properties?: JProperty[];
}

export type JArray = JToken[];

interface JProperty {
  name: string;
  value: JToken;
}

interface JString {
  type: JsonEnum.String;
  value: string;
}

export function json(token: JToken | JArray) {
  return token;
}

type AutomatonScope = Record<string | number, any>;

class AutomatonTemplate implements ITemplate {
  private items: any[] = [];
  private regions: IRegion[] = [];
  constructor(
    public automaton: JsonAutomaton,
    public scope: Scope,
    public property?: string
  ) {}

  push(stateScope: Scope, item: any) {
    if (!(stateScope instanceof Scope)) {
      debugger;
    }
    const { items } = this;
    const idx = items.length;
    items.push(item);

    const templateScope = this.scope;

    return (newValue: any) => {
      if (stateScope.level < templateScope.level) {
        for (const reg of this.regions) {
          reg.update(idx, newValue);
        }
      } else {
        const { currentTarget } = this.automaton;
        currentTarget.update(idx, newValue);
      }
    };
  }

  clone(visible: boolean = true): IRegion {
    var newRegion = this.automaton.pushRegion(visible, this.property);

    for (const item of this.items) {
      newRegion.push(this.scope, item);
    }

    this.regions.push(newRegion);

    return newRegion;
  }
}

class AutomatonRegion {
  private offset: number;
  private items: any[] = [];

  constructor(
    public scope: AutomatonScope,
    public visible: boolean
  ) {
    if (this.scope instanceof Array) {
      this.offset = scope.length;
    } else {
      throw Error(
        'invalid state: expected array scope but got object {' + scope + '}'
      );
    }
  }

  push(scope: Scope, item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);
    if (this.visible) {
      this.scope.push(item);
    }
    return idx;
  }

  update(idx: number, item: any) {
    this.items[idx] = item;

    if (this.visible) {
      if (this.scope instanceof Array) {
        this.scope[this.offset + idx] = item;
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
      this.scope.splice(this.offset, 0, ...this.items);
    } else {
      this.scope.splice(this.offset, this.items.length);
    }
  }
  clone() {
    const self = this;

    this.scope.push(...self.items);
  }
}

class AutomatonProperty {
  private value?: any;
  constructor(
    public obj: Record<any, any>,
    public property: string,
    public visible: boolean
  ) {}

  push(scope: Scope, value: any, property?: string): void {
    if (property !== this.property) throw new Error('FATAL');

    this.value = value;
    if (this.visible) {
      this.obj[this.property] = value;
    }
  }

  show(visible: boolean) {
    if (this.visible === visible) {
      return;
    }

    this.visible = visible;

    if (visible) {
      this.obj[this.property] = this.value;
    } else {
      this.obj[this.property] = undefined;
    }
  }

  update(_: number, __: any) {
    throw new Error('invalid state: update is not supported on property');
  }
}

class AutomatonNode {
  private currentValue?: any;

  constructor(
    public parent: AutomatonScope,
    public property: string | number,
    public visible: boolean = true
  ) {}

  push(scope: Scope, value: any) {
    this.currentValue = value;

    const { parent, property } = this;

    const nodeValue = this.visible ? value : undefined;

    parent[property as any] = nodeValue;

    return (newValue: any) => {
      this.currentValue = newValue;

      parent[property as any] = newValue;
    };
  }

  show(visible: boolean) {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;

    const { parent, property } = this;
    if (visible) {
      parent[property as any] = this.currentValue;
    } else {
      parent[property as any] = undefined;
    }
  }
}

export class JsonAutomaton implements Automaton {
  private scopes: AutomatonScope[] = [];
  private currentScope: Scope = RootScope;
  constructor(public currentTarget: AutomatonScope) {}

  appendNode(visible: boolean, property?: string): INode {
    const { currentTarget } = this;
    if (currentTarget) {
      this.scopes.push(currentTarget);
    }

    const newNode = new AutomatonNode(
      currentTarget,
      property ?? currentTarget.length,
      visible
    );
    this.currentTarget = newNode;
    return newNode;
  }

  pushRegion(visible: boolean, property?: string): IRegion {
    const { currentTarget } = this;
    if (currentTarget) {
      this.scopes.push(currentTarget);
    }

    if (property) {
      const scope = (currentTarget[property] ??= []);
      const newRegion = new AutomatonRegion(scope, visible);
      this.currentTarget = newRegion;

      return newRegion;
    } else {
      const newRegion = new AutomatonRegion(currentTarget, visible);
      this.currentTarget = newRegion;

      return newRegion;
    }
  }

  pushTemplate(scope: Scope, propery?: string): ITemplate {
    const { currentTarget, currentScope } = this;
    if (currentTarget) {
      this.scopes.push(currentTarget);
    }

    const tpl = new AutomatonTemplate(this, scope, propery);
    this.currentTarget = tpl;

    return tpl;
  }

  up(): void {
    this.currentTarget = this.scopes.pop()!;
  }

  setValue(currentTarget: AutomatonScope, value: any, property?: string) {
    if (currentTarget instanceof AutomatonProperty) {
      if (!property) {
        throw Error(
          'invalid state: property is required when current scope is property'
        );
      }
      currentTarget.push(value, property);
    } else if (currentTarget instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      currentTarget.push(RootScope, value);
    } else if (property) {
      if (currentTarget instanceof Array)
        throw Error(
          'invalid state: current expected to be an object when property is provided'
        );

      currentTarget[property] = value;
    } else if (currentTarget instanceof Array) {
      currentTarget.push(value);
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );
  }

  appendObject(property?: string, copy: {} | any[] = {}) {
    const { currentTarget } = this;

    if (currentTarget) {
      this.scopes.push(currentTarget);
    }

    this.setValue(currentTarget, copy, property);

    this.currentTarget = copy;
  }

  appendArray(property?: string) {
    return this.appendObject(property, []);
  }

  appendElement(child: any): Array<any> | Record<any, any> {
    const { currentTarget: current } = this;

    if (!(current instanceof Array)) {
      throw Error('invalid add element on non array');
    }

    this.scopes.push(current);
    if (child instanceof Array) {
      const copy: any[] = [];
      current.push(copy);
      this.currentTarget = copy;
      return child;
    } else {
      const copy = {};
      current.push(copy);
      this.currentTarget = copy;
      return child;
    }
  }

  appendText(
    scope: Scope,
    content: ITextNode['nodeValue'],
    property?: string
  ): TextNodeUpdater {
    const { currentTarget } = this;

    if (currentTarget instanceof AutomatonTemplate) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is template'
      //   );
      // }

      return currentTarget.push(scope, content);
    } else if (currentTarget instanceof AutomatonProperty) {
      if (!property) {
        throw Error(
          'invalid state: property is required when current scope is property'
        );
      }
      currentTarget.push(content, property);
    } else if (currentTarget instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      const idx = currentTarget.push(scope, content);
      return (newValue) => {
        currentTarget.update(idx, newValue);
      };
    } else if (currentTarget instanceof AutomatonNode) {
      return currentTarget.push(scope, content);
    } else if (currentTarget instanceof Array) {
      const nodeIndex = currentTarget.length;
      currentTarget.push(content);

      return function (value: ITextNode['nodeValue']) {
        currentTarget[nodeIndex] = value;
      };
    } else if (property) {
      currentTarget[property] = content;

      return function (value: ITextNode['nodeValue']) {
        currentTarget[property] = value;
      };
    } else {
      throw Error('Not yet implemented!');
    }

    return () => {
      debugger;
    };
  }
}
