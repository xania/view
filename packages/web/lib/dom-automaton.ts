import {
  Automaton,
  AutomatonTarget,
  AutomatonTemplate,
  IRegion,
  ITextNode,
  Lense,
  RootScope,
  Scope,
} from '@xania/reactivity';

export class DomAutomaton implements Automaton {
  public currentTarget: AutomatonTarget;
  public targetStack: AutomatonTarget[] = [];

  constructor(
    rootOutput: HTMLElement,
    public scope: Scope = RootScope
  ) {
    this.currentTarget = {
      output: rootOutput,
      traversal: [],
      patches: (scope.patches ??= new Map()),
      scope,
    };
  }

  appendArray(): void {
    throw new Error('Method not implemented.');
  }
  appendObject(type?: string): void {
    throw new Error('Method not implemented.');
  }
  appendText(content: ITextNode['nodeValue'], property?: string): void {
    throw new Error('Method not implemented.');
  }
  appendValue<T>(lense: Lense<any>, stateValue?: T): void {
    throw new Error('Method not implemented.');
  }
  pushRegion(visible?: boolean | void | undefined): IRegion {
    throw new Error('Method not implemented.');
  }
  pushTemplate(): AutomatonTemplate {
    throw new Error('Method not implemented.');
  }
}
