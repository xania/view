import { Computed, CombineLatest, Property, State } from '../../reactivity';
import {
  CallOperator,
  OperatorEnum,
  OperatorProvider,
  GetOperator,
  AssignOperator,
  CombineLatestOperator,
} from './graph';

type Node = State | Property | Computed | CombineLatest | JoinPoint;

export const operationProvider: OperatorProvider = {
  get(node: Node) {
    if (node instanceof Property) {
      return {
        type: OperatorEnum.Prop,
        source: node.parent.key,
        target: node.key,
        prop: node.name,
      } satisfies GetOperator;
    } else if (node instanceof Computed) {
      return {
        type: OperatorEnum.Call,
        source: node.parent.key,
        target: node.key,
        func: node.compute,
        context: null,
      } satisfies CallOperator;
    } else if (node instanceof CombineLatest) {
      return [
        ...node.sources.map(
          (src, idx) =>
            ({
              type: OperatorEnum.Assign,
              source: src.key,
              target: node.joinKey,
              prop: idx,
            } satisfies AssignOperator)
        ),
        {
          type: OperatorEnum.CombineLatest,
          source: node.joinKey,
          target: node.key,
        } as CombineLatestOperator,
      ];
    } else {
      // return {
      //   type: OperatorEnum.Set
      // }
      // console.error('Unsupported node');
    }
    return null;
  },
  dependencies: function (node: Node): Node | Node[] {
    if (node instanceof Property) {
      return node.parent;
    }
    if (node instanceof Computed) {
      return node.parent;
    }
    if (node instanceof CombineLatest) {
      return new JoinPoint(node.joinKey, node.initial, node.sources);
    }
    if (node instanceof JoinPoint) {
      return node.sources;
    }

    return [];
  },
};

class JoinPoint {
  constructor(
    public key: symbol,
    public initial: any[],
    public sources: Node[]
  ) {}
}
