import {
  AutomatonRegion,
  AutomatonTarget,
  AutomatonTemplate,
  IRegion,
  ITextNode,
  ObjectProperty,
  TextNodeUpdater,
} from './automaton';
import { InstructionEnum, TraversalInstruction } from './program';
import { Scope, State } from './state';

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
    public rootOutput: AutomatonTarget['output'],
    public events: AutomatonTarget['events'] = { [Symbol()]: 'root' as any }
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      events,
    };
  }

  appendObject() {
    const { currentTarget } = this;
    this.targets.push(currentTarget);

    const newObject = {};

    const newNode = new ObjectProperty(newObject);

    this.currentTarget = {
      output: newNode,
      events: currentTarget.events,
      traversal: this.setValue(currentTarget.output, newObject) ?? [],
    };
  }

  selectProperty(prop: string): void {
    const { currentTarget } = this;

    if (currentTarget.output instanceof ObjectProperty) {
      currentTarget.output.prop = prop;
    }
  }

  pushRegion(visible: boolean | void = true): IRegion {
    const { currentTarget } = this;
    if (!currentTarget) {
      throw Error('Cannot push standalone region, a target is not found');
    }

    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }
    this.targets.push(currentTarget);

    const newRegion = new AutomatonRegion(currentTarget.output, visible);

    this.currentTarget = {
      output: newRegion,
      traversal: [
        {
          type: InstructionEnum.SelectFragment,
          index: newRegion.offset,
        },
      ],
    };

    return newRegion;
  }

  pushTemplate(scope: Scope) {
    const { currentTarget } = this;
    if (currentTarget) {
      this.targets.push(currentTarget);
    }
    if (!(currentTarget.output instanceof Array)) {
      throw Error('output is not an array');
    }

    const tpl = new AutomatonTemplate(currentTarget.output, scope);
    this.currentTarget = {
      output: tpl,
      traversal: [
        {
          // TODO verify this is needed
          type: InstructionEnum.SelectFragments,
          indices: tpl.regions,
        },
      ],
      // traversal: resolveTraversal(currentTarget.output),
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

  setValue(
    output: AutomatonTarget['output'],
    value: any
  ): TraversalInstruction[] | void {
    if (output instanceof ObjectProperty) {
      if (!output.prop) {
        throw Error('Cannot set value, prop is not selected');
      }
      output.object[output.prop] = value;
      return [
        {
          type: InstructionEnum.SelectProperty,
          prop: output.prop,
        },
      ];
    } else if (output instanceof AutomatonRegion) {
      output.push(value);
    } else if (output instanceof Array) {
      const offset = output.length;
      output.push(value);
      return [
        {
          type: InstructionEnum.SelectIndex,
          index: offset,
        },
      ];
    } else if (output instanceof AutomatonTemplate) {
      return [
        {
          type: InstructionEnum.SelectIndex,
          index: output.push(value),
        },
      ];
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

    this.currentTarget = {
      output: copy,
      events: currentTarget.events,
      traversal: this.setValue(currentTarget.output, copy) ?? [],
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
        type: InstructionEnum.UpdateObject,
        property: prop,
      });
    } else if (output instanceof Array) {
      const nodeIndex = output.length;
      output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: nodeIndex,
      });
    } else if (output instanceof AutomatonTemplate) {
      const itemIdx = output.push(stateValue);

      if (state.scope.level < output.scope.level) {
        stateEvent.push({
          type: InstructionEnum.UpdateRegions,
          regions: output.regions,
          index: itemIdx,
        });
      } else {
        stateEvent.push({
          type: InstructionEnum.UpdateArray,
          index: itemIdx,
        });
      }
    } else if (output instanceof AutomatonRegion) {
      const idx = output.push(stateValue);

      stateEvent.push({
        type: InstructionEnum.UpdateArray,
        index: idx,
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
      data.push(content);
      return () => {
        debugger;
      };
    } else if (data instanceof AutomatonRegion) {
      const idx = data.push(content);
      return (newValue) => {
        data.update(idx, newValue);
      };
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
    if (output.length == 0) {
      return [];
    } else {
      return [
        {
          type: InstructionEnum.SelectFragment,
          index: output.length,
        },
      ];
    }
  } else if (output instanceof ObjectProperty && output.prop) {
    return [
      {
        type: InstructionEnum.SelectProperty,
        prop: output.prop,
      },
    ];
  } else if (output instanceof AutomatonTemplate) {
    return [];
  } else {
    throw Error('Could not resolve traversal for output');
  }
}
