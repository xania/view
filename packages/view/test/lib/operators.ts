import { Computed, CombineLatest, Property, State } from '../../reactivity';
import {
  ComputedOperator,
  OperatorEnum,
  OperatorProvider,
  GetOperator,
  SetOperator,
} from './graph';

type Node = State | Property | Computed | CombineLatest;

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
        type: OperatorEnum.Computed,
        source: node.parent.key,
        target: node.key,
        compute: node.compute,
      } satisfies ComputedOperator;
    } else if (node instanceof CombineLatest) {
      return node.sources.map(
        (src, idx) =>
          ({
            type: OperatorEnum.Assign,
            source: src.key,
            target: node.key,
            prop: idx,
          } satisfies SetOperator)
      );
    } else {
      // return {
      //   type: OperatorEnum.Set
      // }
      // console.error('Unsupported node');
    }
    return null;
  },
};
