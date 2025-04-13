import {
  Automaton,
  ITextNode,
  popScope,
  SetProperty,
  TextNodeUpdater,
} from './automaton';

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

type AutomatonScope = Array<any> | PropertyScope;

export class JsonAutomaton implements Automaton {
  private scopes: AutomatonScope[] = [];
  constructor(public current: AutomatonScope) {}

  up(): void {
    this.current = this.scopes.pop()!;
  }

  appendElement(child: any): void | SetProperty[] {
    const { current } = this;
    // if (!(current instanceof Array)) {
    //   throw Error('invalid add element on non array');
    // }

    if (child instanceof Array) {
      this.scopes.push(current);
      const copy: any[] = [];
      current.push(copy);
      this.current = copy;
      return child;
    } else if (child === popScope) {
      this.current = this.scopes.pop()!;
      return;
    } else {
      const obj = {};
      current.push(obj);

      var properties = Object.keys(child);
      if (properties.length == 0) {
        return;
      }
      this.scopes.push(current);
      const children: any[] = [];

      let nextScope: PropertyScope;
      for (const key of properties) {
        nextScope = new PropertyScope(obj, key);
        this.scopes.push(nextScope);
        children.push(child[key]);
        children.push(popScope);
      }
      this.current = this.scopes.pop()!;

      return children;
    }
  }

  appendText(content: ITextNode['nodeValue']): TextNodeUpdater {
    const { current } = this;

    if (current instanceof Array) {
      const nodeIndex = current.length;
      current.push(content);

      return function (value: ITextNode['nodeValue']) {
        current[nodeIndex] = value;
      };
    } else {
      current.push(content);

      return function (value: ITextNode['nodeValue']) {
        current.push(value);
      };
    }
  }
}

class PropertyScope {
  constructor(
    public obj: any,
    public name: string
  ) {}

  push(value: any) {
    this.obj[this.name] = value;
  }
}
