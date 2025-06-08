import {
  Automaton,
  IRegion,
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

type AutomatonScope = Array<any> | Record<any, any>;

export class JsonAutomaton implements Automaton {
  private scopes: AutomatonScope[] = [];
  constructor(public current: AutomatonScope) {}

  startRegion(visible: boolean): IRegion {
    throw new Error('Method not implemented.');
  }

  up(): void {
    this.current = this.scopes.pop()!;
  }

  appendObject(property?: string) {
    const { current } = this;
    const copy = {};

    if (current) {
      this.scopes.push(current);
    }

    if (property) {
      if (current instanceof Array)
        throw Error(
          'invalid state: current expected to be an object when property is provided'
        );

      current[property] = copy;
    } else if (current instanceof Array) {
      current.push(copy);
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );

    this.current = copy;
  }

  appendArray(property?: string) {
    const { current } = this;
    const copy: any[] = [];

    if (current) {
      this.scopes.push(current);
    }

    if (property) {
      if (current instanceof Array)
        throw Error(
          'invalid state: current expected to be an object when property is provided'
        );

      current[property] = copy;
    } else if (current instanceof Array) {
      current.push(copy);
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );

    this.current = copy;
  }

  appendElement(child: any): Array<any> | Record<any, any> {
    const { current } = this;

    if (!(current instanceof Array)) {
      throw Error('invalid add element on non array');
    }

    this.scopes.push(current);
    if (child instanceof Array) {
      const copy: any[] = [];
      current.push(copy);
      this.current = copy;
      return child;
    } else {
      const copy = {};
      current.push(copy);
      this.current = copy;
      return child;

      // var properties = Object.keys(child);
      // if (properties.length == 0) {
      //   return properties as any;
      // }

      // this.scopes.push(current);
      // const children: any[] = [];

      // let nextScope: PropertyScope;
      // for (const key of properties) {
      //   nextScope = new PropertyScope(obj, key);
      //   this.scopes.push(nextScope);
      //   children.push(child[key]);
      //   children.push(popScope);
      // }
      // this.current = this.scopes.pop()!;

      // return children;
    }
  }

  appendText(
    content: ITextNode['nodeValue'],
    property?: string
  ): TextNodeUpdater {
    const { current } = this;

    if (current instanceof Array) {
      const nodeIndex = current.length;
      current.push(content);

      return function (value: ITextNode['nodeValue']) {
        current[nodeIndex] = value;
      };
    } else if (property) {
      current[property] = content;

      return function (value: ITextNode['nodeValue']) {
        current[property] = value;
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
