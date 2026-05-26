import {
  Automaton,
  INode,
  IRegion,
  ITemplate,
  ITextNode,
  TextNodeUpdater,
} from './automaton';
import {
  InstructionEnum,
  Program,
  TraversalEnum,
  TraversalInstruction,
} from './program';
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

type AutomatonOutput = Record<string | number, any> | any[];
type AutomatonTarget = {
  output:
    | ObjectProperty
    | AutomatonRegion
    | AutomatonNode
    | AutomatonTemplate
    | AutomatonOutput;
  events?: Record<string | number, any>;
  traversal: TraversalInstruction[];
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
    public output: AutomatonOutput,
    public visible: boolean
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
    public prop?: string
  ) {}
}

export class JsonAutomaton implements Automaton {
  private targets: AutomatonTarget[] = [];
  public currentTarget: AutomatonTarget;
  constructor(private rootData: AutomatonTarget['output']) {
    this.currentTarget = {
      output: rootData,
      traversal: resolveTraversal(rootData),
    };
  }

  appendObject() {
    const { currentTarget } = this;
    this.targets.push(currentTarget);

    const newObject = {};
    this.setValue(currentTarget.output, newObject);

    const newNode = new ObjectProperty(newObject);
    this.currentTarget = {
      output: newNode,
      traversal: resolveTraversal(currentTarget.output),
    };
  }

  selectProperty(prop: string): void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof ObjectProperty) {
      currentTarget.output.prop = prop;
    }
  }

  appendNode(visible: boolean): INode {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof Array)) {
      throw Error('Invalid target: expected array');
    }
    this.targets.push(currentTarget);

    const newNode = new AutomatonNode(currentTarget.output, visible);
    this.currentTarget = {
      output: newNode,
      traversal: resolveTraversal(currentTarget.output),
    };
    return newNode;
  }

  pushRegion(visible: boolean): IRegion {
    const { currentTarget } = this;
    if (!currentTarget) {
      throw Error('Cannot push standalone region, a target is not found');
    }
    this.targets.push(currentTarget);

    const newRegion = new AutomatonRegion(currentTarget.output, visible);
    this.currentTarget = {
      output: newRegion,
      traversal: resolveTraversal(currentTarget.output),
    };

    return newRegion;
  }

  pushTemplate(scope: Scope): ITemplate {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const tpl = new AutomatonTemplate(this, scope);
    this.currentTarget = { output: tpl, traversal: [] };

    return tpl;
  }

  popTarget(): void {
    if (this.targets.length == 0) {
      throw Error('cannot pop out root');
    }
    this.currentTarget = this.targets.pop()!;
  }

  setValue(output: AutomatonTarget['output'], value: any) {
    if (output instanceof ObjectProperty) {
      if (!output.prop) {
        throw Error('Cannot set value, prop is not selected');
      }
      output.object[output.prop] = value;
    } else if (output instanceof AutomatonRegion) {
      // if (property) {
      //   throw Error(
      //     'invalid state: property is not allowed when current scope is region'
      //   );
      // }
      output.push(value);
    } else if (output instanceof Array) {
      output.push(value);
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
    this.setValue(currentTarget.output, copy);

    this.currentTarget = {
      output: copy,
      events: {},
      traversal: resolveTraversal(currentTarget.output),
    };
  }

  appendValue<T>(sourceScope: Scope, stateValue?: T): Program | undefined {
    const { output: data } = this.currentTarget;

    if (data instanceof ObjectProperty) {
      const { object, prop } = data;
      if (!prop) {
        throw Error('Cannot append value to object, need prop');
      }
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
    const { output: data } = this.currentTarget;

    if (data instanceof ObjectProperty) {
      if (!data.prop) {
        throw Error('Cannot append text, prop is not selected');
      }
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

function resolveTraversal(
  output: AutomatonTarget['output']
): TraversalInstruction[] {
  if (output instanceof Array) {
    return [
      {
        type: TraversalEnum.SelectIndex,
        index: output.length,
      },
    ];
  } else if (output instanceof ObjectProperty && output.prop) {
    return [
      {
        type: TraversalEnum.SelectProperty,
        prop: output.prop,
      },
    ];
  } else {
    throw Error('Could not resolve traversal for output');
  }
}
