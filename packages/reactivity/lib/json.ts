import {
  Automaton,
  INode,
  IRegion,
  ITemplate,
  ITextNode,
  TextNodeUpdater,
} from './automaton';
import { InstructionEnum, Program } from './program';
import { RootScope, Scope, State } from './state';

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

type AutomatonTarget = Record<string | number, any>;

class AutomatonTemplate implements ITemplate {
  private items: any[] = [];
  public regions: IRegion[] = [];
  constructor(
    public automaton: JsonAutomaton,
    public scope: Scope
  ) {}

  push(item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);

    return idx;
  }

  clone(visible: boolean = true): IRegion {
    var newRegion = this.automaton.pushRegion(visible);

    for (const item of this.items) {
      newRegion.push(item);
    }

    this.regions.push(newRegion);

    return newRegion;
  }
}

class AutomatonRegion {
  private offset: number;
  private items: any[] = [];

  constructor(
    public scope: AutomatonTarget,
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

  push(item: any) {
    if (item instanceof Scope) {
      debugger;
    }
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

class AutomatonNode {
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

class ObjectProperty {
  constructor(
    public object: any,
    public prop: string
  ) {}
}

export class JsonAutomaton implements Automaton {
  private targets: AutomatonTarget[] = [];
  private currentScope: Scope = RootScope;
  constructor(public currentTarget: AutomatonTarget) {}

  appendProperties(properties: string[]): void {
    if (properties.length > 0) {
      const newObject = {};

      const { currentTarget } = this;
      this.setValue(currentTarget, newObject);

      for (const prop of properties) {
        const newNode = new ObjectProperty(newObject, prop);

        if (this.currentTarget) {
          this.targets.push(this.currentTarget);
        }
        this.currentTarget = newNode;
      }
    }
  }

  appendNode(visible: boolean): INode {
    const { currentTarget } = this;
    if (!(currentTarget instanceof Array)) {
      throw Error('Invalid target: expected array');
    }
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const newNode = new AutomatonNode(currentTarget, visible);
    this.currentTarget = newNode;
    return newNode;
  }

  pushRegion(visible: boolean): IRegion {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const newRegion = new AutomatonRegion(currentTarget, visible);
    this.currentTarget = newRegion;

    return newRegion;
  }

  pushTemplate(scope: Scope): ITemplate {
    const { currentTarget, currentScope } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const tpl = new AutomatonTemplate(this, scope);
    this.currentTarget = tpl;

    return tpl;
  }

  popTarget(): void {
    this.currentTarget = this.targets.pop()!;
  }

  setValue(currentTarget: AutomatonTarget, value: any) {
    if (currentTarget instanceof ObjectProperty) {
      currentTarget.object[currentTarget.prop] = value;
    } else if (currentTarget instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      currentTarget.push(value);
    } else if (currentTarget instanceof Array) {
      currentTarget.push(value);
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );
  }

  appendArray() {
    const { currentTarget } = this;

    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const copy: any[] = [];
    this.setValue(currentTarget, copy);

    this.currentTarget = copy;
  }

  appendElement(child: any): Array<any> | Record<any, any> {
    const { currentTarget: current } = this;

    if (!(current instanceof Array)) {
      throw Error('invalid add element on non array');
    }

    this.targets.push(current);
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

  appendValue<T>(sourceScope: Scope, stateValue?: T): Program | undefined {
    const { currentTarget } = this;

    if (currentTarget instanceof ObjectProperty) {
      const { object, prop } = currentTarget;
      object[prop] = stateValue;
      return [
        {
          type: InstructionEnum.Update,
          level: 0,
          target: object,
          property: prop,
        },
      ];
    } else if (currentTarget instanceof Array) {
      const nodeIndex = currentTarget.length;
      currentTarget.push(stateValue);

      return [
        {
          type: InstructionEnum.Update,
          level: 0,
          target: currentTarget,
          property: nodeIndex,
        },
      ];
    } else if (currentTarget instanceof AutomatonTemplate) {
      const itemIdx = currentTarget.push(stateValue);

      if (sourceScope.level < currentTarget.scope.level) {
        return [
          {
            type: InstructionEnum.UpdateMany,
            level: 0,
            targets: currentTarget.regions,
            property: itemIdx,
          },
        ];
      } else {
        return [
          {
            type: InstructionEnum.Update,
            level: 0,
            property: itemIdx,
          },
        ];
      }
    } else if (currentTarget instanceof AutomatonNode) {
      currentTarget.push(stateValue);
      return [
        {
          type: InstructionEnum.Update,
          level: 0,
          target: currentTarget,
          property: currentTarget.index,
        },
      ];
    } else {
      debugger;
    }
  }

  appendText(
    scope: Scope,
    content: ITextNode['nodeValue'],
    property?: string
  ): TextNodeUpdater {
    const { currentTarget } = this;

    if (currentTarget instanceof ObjectProperty) {
      currentTarget.object[currentTarget.prop] = content;
      return () => {
        debugger;
      };
    } else if (currentTarget instanceof AutomatonTemplate) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is template'
      //   );
      // }

      currentTarget.push(content);
      return () => {
        debugger;
      };
    } else if (currentTarget instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      const idx = currentTarget.push(content);
      return (newValue) => {
        currentTarget.update(idx, newValue);
      };
    } else if (currentTarget instanceof AutomatonNode) {
      currentTarget.push(content);
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
