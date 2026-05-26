import {
  Automaton,
  INode,
  IRegion,
  ITemplate,
  ITextNode,
  TextNodeUpdater,
} from './automaton';
import { InstructionEnum, Program } from './program';
import { Scope } from './state';

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

type AutomatonData = Record<string | number, any> | any[];
type AutomatonTarget = {
  data:
    | ObjectProperty
    | AutomatonRegion
    | AutomatonNode
    | AutomatonTemplate
    | AutomatonData;
  events?: Record<string | number, any>;
};

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
    public target: AutomatonData,
    public visible: boolean
  ) {
    if (this.target instanceof Array) {
      this.offset = this.target.length;
    } else {
      throw Error(
        'invalid state: expected array scope but got object {' +
          this.target +
          '}'
      );
    }
  }

  push(item: any) {
    const { items } = this;
    const idx = items.length;
    items.push(item);
    if (this.visible) {
      this.target.push(item);
    }
    return idx;
  }

  update(idx: number, item: any) {
    this.items[idx] = item;

    if (this.visible) {
      if (this.target instanceof Array) {
        this.target[this.offset + idx] = item;
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
      this.target.splice(this.offset, 0, ...this.items);
    } else {
      this.target.splice(this.offset, this.items.length);
    }
  }
  clone() {
    const self = this;

    this.target.push(...self.items);
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
  public currentTarget: AutomatonTarget;
  constructor(rootData: AutomatonTarget['data']) {
    this.currentTarget = { data: rootData };
  }

  appendProperties(properties: string[]): void {
    if (properties.length > 0) {
      const newObject = {};

      const { currentTarget } = this;
      this.setValue(currentTarget.data, newObject);

      for (const prop of properties) {
        const newNode = new ObjectProperty(newObject, prop);

        if (this.currentTarget) {
          this.targets.push(this.currentTarget);
        }
        this.currentTarget = { data: newNode };
      }
    }
  }

  appendNode(visible: boolean): INode {
    const { currentTarget } = this;
    if (!(currentTarget.data instanceof Array)) {
      throw Error('Invalid target: expected array');
    }
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const newNode = new AutomatonNode(currentTarget.data, visible);
    this.currentTarget = { data: newNode };
    return newNode;
  }

  pushRegion(visible: boolean): IRegion {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const newRegion = new AutomatonRegion(currentTarget.data, visible);
    this.currentTarget = { data: newRegion };

    return newRegion;
  }

  pushTemplate(scope: Scope): ITemplate {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const tpl = new AutomatonTemplate(this, scope);
    this.currentTarget = { data: tpl };

    return tpl;
  }

  popTarget(): void {
    this.currentTarget = this.targets.pop()!;
  }

  setValue(currentTarget: AutomatonTarget['data'], value: any) {
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
    this.setValue(currentTarget.data, copy);

    this.currentTarget = { data: copy, events: {} };
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
      this.currentTarget = { data: copy };
      return child;
    } else {
      const copy = {};
      current.push(copy);
      this.currentTarget = { data: copy };
      return child;
    }
  }

  appendValue<T>(sourceScope: Scope, stateValue?: T): Program | undefined {
    const { data } = this.currentTarget;

    if (data instanceof ObjectProperty) {
      const { object, prop } = data;
      object[prop] = stateValue;
      return [
        {
          type: InstructionEnum.Update,
          target: object,
          property: prop,
        },
      ];
    } else if (data instanceof Array) {
      const nodeIndex = data.length;
      data.push(stateValue);

      return [
        {
          type: InstructionEnum.Update,
          target: data,
          property: nodeIndex,
        },
      ];
    } else if (data instanceof AutomatonTemplate) {
      const itemIdx = data.push(stateValue);

      if (sourceScope.level < data.scope.level) {
        return [
          {
            type: InstructionEnum.UpdateMany,
            targets: data.regions,
            property: itemIdx,
          },
        ];
      } else {
        return [
          {
            type: InstructionEnum.Update,
            property: itemIdx,
          },
        ];
      }
    } else if (data instanceof AutomatonNode) {
      data.push(stateValue);
      return [
        {
          type: InstructionEnum.Update,
          target: data,
          property: data.index,
        },
      ];
    } else {
      debugger;
    }
  }

  appendText(
    content: ITextNode['nodeValue'],
    property?: string
  ): TextNodeUpdater {
    if (content instanceof Scope) {
      debugger;
    }
    const { data } = this.currentTarget;

    if (data instanceof ObjectProperty) {
      data.object[data.prop] = content;
      return () => {
        debugger;
      };
    } else if (data instanceof AutomatonTemplate) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is template'
      //   );
      // }

      data.push(content);
      return () => {
        debugger;
      };
    } else if (data instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      const idx = data.push(content);
      return (newValue) => {
        data.update(idx, newValue);
      };
    } else if (data instanceof AutomatonNode) {
      data.push(content);
    } else if (data instanceof Array) {
      const nodeIndex = data.length;
      data.push(content);

      return function (value: ITextNode['nodeValue']) {
        data[nodeIndex] = value;
      };
    } else if (property) {
      const target = data as Record<string | number, any>;
      target[property] = content;

      return function (value: ITextNode['nodeValue']) {
        target[property] = value;
      };
    } else {
      throw Error('Not yet implemented!');
    }

    return () => {
      debugger;
    };
  }
}
