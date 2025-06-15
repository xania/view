import { Automaton, IRegion, ITextNode, TextNodeUpdater } from './automaton';

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
class AutomatonRegion {
  private items: any[] = [];
  private offset: number;
  constructor(
    public scope: AutomatonScope,
    public visible: boolean
  ) {
    this.offset = scope.length;
  }

  push(item: any) {
    this.items.push(item);
    if (this.visible) {
      this.scope.push(item);
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
}

class AutomatonProperty {
  private value?: any;
  constructor(
    public obj: Record<any, any>,
    public property: string,
    public visible: boolean
  ) {}

  push(value: any, property: string) {
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
}

export class JsonAutomaton implements Automaton {
  private scopes: AutomatonScope[] = [];
  constructor(public currentScope: AutomatonScope) {}

  pushRegion(visible: boolean, property?: string): IRegion {
    const { currentScope } = this;
    if (currentScope) {
      this.scopes.push(currentScope);
    }

    if (property) {
      const newRegion = new AutomatonProperty(currentScope, property, visible);
      this.currentScope = newRegion;

      return newRegion;
    } else {
      const newRegion = new AutomatonRegion(currentScope, visible);
      this.currentScope = newRegion;

      return newRegion;
    }
  }

  up(): void {
    this.currentScope = this.scopes.pop()!;
  }

  appendObject(property?: string, copy: {} | any[] = {}) {
    const { currentScope } = this;

    if (currentScope) {
      this.scopes.push(currentScope);
    }

    if (property) {
      if (currentScope instanceof Array)
        throw Error(
          'invalid state: current expected to be an object when property is provided'
        );

      currentScope[property] = copy;
    } else if (currentScope instanceof Array) {
      currentScope.push(copy);
    } else
      throw Error(
        'invalid state: current expected to be array when property is not provided'
      );

    this.currentScope = copy;
  }

  appendArray(property?: string) {
    return this.appendObject(property, []);
  }

  appendElement(child: any): Array<any> | Record<any, any> {
    const { currentScope: current } = this;

    if (!(current instanceof Array)) {
      throw Error('invalid add element on non array');
    }

    this.scopes.push(current);
    if (child instanceof Array) {
      const copy: any[] = [];
      current.push(copy);
      this.currentScope = copy;
      return child;
    } else {
      const copy = {};
      current.push(copy);
      this.currentScope = copy;
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
    const { currentScope } = this;

    if (currentScope instanceof AutomatonProperty) {
      if (!property) {
        throw Error('invalid');
      }
      currentScope.push(content, property);
    } else if (currentScope instanceof AutomatonRegion) {
      if (property) {
        throw Error('invalid');
      }
      currentScope.push(content);
    } else if (currentScope instanceof Array) {
      const nodeIndex = currentScope.length;
      currentScope.push(content);

      return function (value: ITextNode['nodeValue']) {
        currentScope[nodeIndex] = value;
      };
    } else if (property) {
      currentScope[property] = content;

      return function (value: ITextNode['nodeValue']) {
        currentScope[property] = value;
      };
    } else {
      currentScope.push(content);

      return function (value: ITextNode['nodeValue']) {
        currentScope.push(value);
      };
    }
    return () => {
      debugger;
    };
  }
}
