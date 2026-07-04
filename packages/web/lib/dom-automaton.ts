import {
  Automaton,
  AutomatonTarget,
  ITextNode,
  Lense,
  RootScope,
  Scope,
} from '@xania/reactivity';

export class DomAutomaton implements Automaton {
  public currentTarget: AutomatonTarget;

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

  appendArray(): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
  appendObject(type?: string): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
  appendText(content: ITextNode['nodeValue'], property?: string): void {
    throw new Error('Method not implemented.');
  }
  appendValue<T>(lense: Lense<any>, stateValue?: T): void {
    throw new Error('Method not implemented.');
  }
  pushRegion(visible?: boolean | void | undefined): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
  pushTemplate(): AutomatonTarget {
    throw new Error('Method not implemented.');
  }
}
