import {
  AutomatonNode,
  AutomatonRegion,
  AutomatonTarget,
  AutomatonTemplate,
  INode,
  IRegion,
  ITemplate,
  ITextNode,
  ObjectProperty,
  TextNodeUpdater,
} from './automaton';
import { InstructionEnum, Program, TraversalInstruction } from './program';
import { Scope, State, Value } from './state';

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

export class JsonAutomaton {
  private targets: AutomatonTarget[] = [];
  public currentTarget: AutomatonTarget;
  constructor(
    rootData: AutomatonTarget['output'],
    public events: AutomatonTarget['events'] = { [Symbol()]: 'root' as any }
  ) {
    this.currentTarget = {
      output: rootData,
      traversal: [],
      events,
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
      events: currentTarget.events,
      traversal: resolveTraversal(currentTarget.output),
    };
  }

  selectProperty(prop: string): void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof ObjectProperty) {
      currentTarget.output.prop = prop;
    }
  }

  appendNode(visible: State<boolean>): INode {
    const { currentTarget } = this;
    if (!(currentTarget.output instanceof Array)) {
      throw Error('Invalid target: expected array');
    }
    this.targets.push(currentTarget);

    const newNode = new AutomatonNode(currentTarget.output, !!visible.initial);
    this.currentTarget = {
      output: newNode,
      traversal: resolveTraversal(currentTarget.output),
    };
    return newNode;
  }

  pushRegion(visible: boolean | void = true): IRegion {
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

  pushTemplate(scope: Scope) {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }

    const tpl = new AutomatonTemplate(this, scope);
    this.currentTarget = {
      output: tpl,
      traversal: resolveTraversal(currentTarget.output),
    };

    return tpl;
  }

  popTarget(): void {
    if (this.targets.length == 0) {
      throw Error('cannot pop out root');
    }

    const { currentTarget } = this;
    const { events } = currentTarget;

    const parentTarget = this.targets.pop()!;

    if (events) {
      const parentEvents = (parentTarget.events ??= {});

      for (const key of Reflect.ownKeys(events)) {
        parentEvents[key] = [...currentTarget.traversal, ...events[key]];
      }
    }

    this.currentTarget = parentTarget;
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
    } else if (output instanceof AutomatonTemplate) {
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
      events: currentTarget.events,
      traversal: resolveTraversal(currentTarget.output),
    };
  }

  appendValue<T>(state: State<any>, stateValue?: T): void {
    let { output } = this.currentTarget;

    const currentEvents = (this.currentTarget.events ??= {});

    const stateEvent = (currentEvents[state.graph] ??= []);

    if (output instanceof ObjectProperty) {
      const { object, prop } = output;
      if (!prop) {
        throw Error('Cannot append value to object, need prop');
      }
      object[prop] = stateValue;

      stateEvent.push({
        type: InstructionEnum.Update,
        target: object,
        property: prop,
      });
    } else if (output instanceof Array) {
      const nodeIndex = output.length;
      output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.Update,
        target: output,
        property: nodeIndex,
      });
    } else if (output instanceof AutomatonTemplate) {
      const itemIdx = output.push(stateValue);

      if (state.scope.level < output.scope.level) {
        stateEvent.push({
          type: InstructionEnum.UpdateMany,
          targets: output.regions,
          property: itemIdx,
        });
      } else {
        stateEvent.push({
          type: InstructionEnum.Update,
          target: output,
          property: itemIdx,
        });
      }
    } else if (output instanceof AutomatonNode) {
      output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.Update,
        target: output,
        property: output.index,
      });
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.Update,
        target: output,
        property: idx,
      });
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
        type: InstructionEnum.SelectIndex,
        index: output.length,
      },
    ];
  } else if (output instanceof ObjectProperty && output.prop) {
    return [
      {
        type: InstructionEnum.SelectProperty,
        prop: output.prop,
      },
    ];
  } else if (output instanceof AutomatonTemplate) {
    return [];
  } else if (output instanceof AutomatonNode) {
    return [
      {
        type: InstructionEnum.SelectIndex,
        index: output.index,
      },
    ];
  } else {
    throw Error('Could not resolve traversal for output');
  }
}
