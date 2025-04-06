import { Automaton, ITextNode, TextNodeUpdater } from './automaton';

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

export class JsonAutomaton implements Automaton {
  private scopes: any[] = [];
  constructor(public current: any[] | JPropertyScope) {}

  up(): void {
    this.current = this.scopes.pop();
  }

  appendElement(child: any) {
    const { current } = this;

    if (child instanceof Array) {
      this.scopes.push(current);
      const copy: any[] = [];
      current.push(copy);
      this.current = copy;
      return child;
    } else if (child === popScope) {
      this.current = this.scopes.pop();
      return;
    } else if (child instanceof JPropertyScope) {
      const { scopes } = this;
      scopes.push(current);
      this.current = child;
    } else {
      const obj = {};
      current.push(obj);

      const children: any[] = [];

      for (const key of Object.keys(child)) {
        children.push(new JPropertyScope(obj, key));
        children.push(child[key]);
        children.push(popScope);
      }

      return children;
    }
  }

  appendText(content: ITextNode['nodeValue']): TextNodeUpdater {
    const { current } = this;

    if (current instanceof JPropertyScope) {
      current.push(content);
      return (value: any) => current.push(value);
    } else {
      const nodeIndex = current.length;
      current.push(content);

      return function (value: ITextNode['nodeValue']) {
        current[nodeIndex] = value;
      };
    }
  }
}

class JPropertyScope {
  constructor(public obj: any, public key: string) {}

  push(value: any) {
    this.obj[this.key] = value;
  }
}

const popScope = Symbol();
